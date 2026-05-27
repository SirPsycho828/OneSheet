import { Router, Response } from "express";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { getAdminTierStatus } from "../lib/adminUtils";
import * as dns from "dns";
import * as net from "net";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if an IP address (IPv4 or IPv6) is in a private/reserved range. */
function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4) return true; // malformed → block
    const [a, b] = parts;
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) // link-local
    );
  }

  // IPv6 checks
  const norm = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (norm === "::1" || norm === "::") return true;
  if (norm.startsWith("fe80")) return true;  // link-local
  if (norm.startsWith("fc") || norm.startsWith("fd")) return true;  // unique-local
  // IPv4-mapped IPv6 (::ffff:x.x.x.x)
  const v4Mapped = norm.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4Mapped) return isPrivateIp(v4Mapped[1]);

  return false;
}

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AIModelConfig {
  apiKey: string;
  modelId: string;
}

async function getAIModelForUser(userId: string): Promise<AIModelConfig | null> {
  const db = admin.firestore();
  const [keyDoc, aiDoc, userDoc, adminTier] = await Promise.all([
    db.collection("config").doc("openrouter").get(),
    db.collection("config").doc("ai").get(),
    db.collection("users").doc(userId).get(),
    getAdminTierStatus(userId),
  ]);

  const apiKey = keyDoc.data()?.apiKey as string | undefined;
  if (!apiKey) return null;

  const aiData = aiDoc.data();
  const freeModelId = aiData?.freeModelId as string | undefined;
  const proModelId = aiData?.proModelId as string | undefined;
  const legacyModelId = aiData?.activeModelId as string | undefined;

  const subscriptionStatus: string =
    userDoc.data()?.subscription?.status ?? "free";
  const isPro = adminTier.isAdmin
    ? adminTier.isPro
    : subscriptionStatus === "active";

  const modelId = isPro
    ? proModelId ?? legacyModelId
    : freeModelId ?? legacyModelId;

  if (!modelId) return null;
  return { apiKey, modelId };
}

async function callOpenRouter(
  apiKey: string,
  modelId: string,
  messages: OpenRouterMessage[],
  maxTokens = 2048
): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://onesheet.cv",
      "X-Title": "OneSheet",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    // Log only the status code, not the full response body (may contain sensitive API details)
    logger.error("OpenRouter API error:", response.status);

    let userMessage = `AI service error (${response.status})`;
    try {
      const parsed = JSON.parse(errorBody) as {
        error?: { message?: string; metadata?: { raw?: string } };
      };
      if (response.status === 429) {
        userMessage = "AI model is temporarily rate-limited. Please try again in a moment.";
      } else if (parsed.error?.message) {
        userMessage = parsed.error.message;
      }
    } catch {
      // use default message
    }

    const err = new Error(userMessage);
    (err as Error & { statusCode: number }).statusCode = response.status;
    throw err;
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

// ---------------------------------------------------------------------------
// POST /api/ai/polish
// ---------------------------------------------------------------------------
router.post(
  "/polish",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { bullets } = req.body as { bullets?: string[] };

    if (!bullets || !Array.isArray(bullets) || bullets.length === 0) {
      res.status(400).json({
        error: { code: "MISSING_BULLETS", message: "bullets array is required" },
      });
      return;
    }

    if (bullets.length > 20) {
      res.status(400).json({
        error: { code: "TOO_MANY_BULLETS", message: "Maximum 20 bullets per request" },
      });
      return;
    }

    try {
      const config = await getAIModelForUser(req.userId!);
      if (!config) {
        res.status(503).json({
          error: { code: "AI_NOT_CONFIGURED", message: "AI is not configured. Contact the admin." },
        });
        return;
      }

      const numberedBullets = bullets.map((b, i) => `${i + 1}. ${b}`).join("\n");

      const result = await callOpenRouter(config.apiKey, config.modelId, [
        {
          role: "system",
          content: `You are an expert resume writer. Your job is to polish resume bullet points to be more impactful and professional.

Rules:
- Start each bullet with a strong action verb (Led, Built, Designed, Optimized, etc.)
- Include quantifiable metrics where possible (%, $, counts, time saved)
- Keep bullets concise (1-2 lines max)
- Preserve the original meaning — do NOT invent facts
- If a bullet already looks good, make only minor improvements
- Return ONLY the polished bullets, numbered to match the input
- Do not add any commentary or explanations`,
        },
        {
          role: "user",
          content: `Polish these resume bullets:\n\n${numberedBullets}`,
        },
      ]);

      const polished = result
        .split("\n")
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
        .filter((line) => line.length > 0);

      res.json({ polished });
    } catch (err) {
      logger.error("ai/polish error:", err);
      const message = err instanceof Error ? err.message : "Failed to polish bullets. Please try again.";
      const status = (err as Error & { statusCode?: number }).statusCode === 429 ? 429 : 500;
      res.status(status).json({
        error: { code: "AI_ERROR", message },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/ai/score
// ---------------------------------------------------------------------------
router.post(
  "/score",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { markdown, jobDescription } = req.body as {
      markdown?: string;
      jobDescription?: string;
    };

    if (!markdown || !jobDescription) {
      res.status(400).json({
        error: {
          code: "MISSING_FIELDS",
          message: "Both markdown (resume) and jobDescription are required",
        },
      });
      return;
    }

    try {
      const config = await getAIModelForUser(req.userId!);
      if (!config) {
        res.status(503).json({
          error: { code: "AI_NOT_CONFIGURED", message: "AI is not configured. Contact the admin." },
        });
        return;
      }

      const result = await callOpenRouter(config.apiKey, config.modelId, [
        {
          role: "system",
          content: `You are an expert ATS (Applicant Tracking System) analyst. Analyze a resume against a job description and provide a match score.

Return ONLY valid JSON (no markdown code fences) with this exact structure:
{
  "score": <number 0-100>,
  "matches": ["keyword or skill that matches", ...],
  "gaps": ["missing keyword or skill", ...],
  "suggestions": ["specific actionable suggestion to improve match", ...]
}

Rules:
- Score 80+ means strong match
- Score 50-79 means moderate match with gaps
- Score below 50 means significant gaps
- List actual keywords/skills from the job description
- Keep suggestions specific and actionable
- Maximum 8 items per array`,
        },
        {
          role: "user",
          content: `Job Description:\n${jobDescription}\n\nResume:\n${markdown}`,
        },
      ]);

      const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned) as {
        score: number;
        matches: string[];
        gaps: string[];
        suggestions: string[];
      };

      res.json(parsed);
    } catch (err) {
      logger.error("ai/score error:", err);
      const message = err instanceof Error ? err.message : "Failed to score resume. Please try again.";
      const status = (err as Error & { statusCode?: number }).statusCode === 429 ? 429 : 500;
      res.status(status).json({
        error: { code: "AI_ERROR", message },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/ai/extract-job
// ---------------------------------------------------------------------------
router.post(
  "/extract-job",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { url } = req.body as { url?: string };

    if (!url || typeof url !== "string") {
      res.status(400).json({
        error: { code: "MISSING_URL", message: "url is required" },
      });
      return;
    }

    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      if (!["http:", "https:"].includes(parsed.protocol)) {
        res.status(400).json({
          error: { code: "INVALID_URL", message: "URL not allowed" },
        });
        return;
      }

      // Block obviously private hostnames and internal patterns
      const strippedHostname = hostname.replace(/^\[|\]$/g, "");
      if (
        /^(localhost|.*\.local|.*\.internal|.*\.intranet|.*\.corp|.*\.home)$/i.test(strippedHostname) ||
        (net.isIP(strippedHostname) && isPrivateIp(strippedHostname))
      ) {
        res.status(400).json({
          error: { code: "INVALID_URL", message: "URL not allowed" },
        });
        return;
      }

      // Resolve DNS (both IPv4 and IPv6) and check resolved IPs
      if (!net.isIP(strippedHostname)) {
        const [v4Result, v6Result] = await Promise.allSettled([
          dns.promises.resolve4(hostname),
          dns.promises.resolve6(hostname),
        ]);

        const allAddresses: string[] = [];
        if (v4Result.status === "fulfilled") allAddresses.push(...v4Result.value);
        if (v6Result.status === "fulfilled") allAddresses.push(...v6Result.value);

        if (allAddresses.length === 0) {
          res.status(400).json({
            error: { code: "INVALID_URL", message: "URL not allowed" },
          });
          return;
        }

        for (const ip of allAddresses) {
          if (isPrivateIp(ip)) {
            res.status(400).json({
              error: { code: "INVALID_URL", message: "URL not allowed" },
            });
            return;
          }
        }
      }
    } catch {
      res.status(400).json({
        error: { code: "INVALID_URL", message: "Invalid URL format" },
      });
      return;
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; OneSheet/1.0)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        res.status(422).json({
          error: {
            code: "FETCH_FAILED",
            message: "Could not fetch the job listing. Try copying and pasting the job description instead.",
          },
        });
        return;
      }

      const html = await response.text();

      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<\/(p|div|h[1-6]|li|br|tr)>/gi, "\n")
        .replace(/<(br|hr)\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (text.length < 50) {
        res.status(422).json({
          error: {
            code: "NO_CONTENT",
            message: "Could not extract job listing content. The page may require JavaScript. Try copying and pasting the job description instead.",
          },
        });
        return;
      }

      const truncated = text.length > 10000 ? text.substring(0, 10000) : text;
      res.json({ text: truncated });
    } catch (err) {
      logger.error("ai/extract-job error:", err);
      res.status(422).json({
        error: {
          code: "FETCH_FAILED",
          message: "Could not fetch the job listing. Try copying and pasting the job description instead.",
        },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/ai/import-text
// ---------------------------------------------------------------------------
router.post(
  "/import-text",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { text } = req.body as { text?: string };

    if (!text || typeof text !== "string" || text.trim().length < 20) {
      res.status(400).json({
        error: { code: "MISSING_TEXT", message: "Resume text is required (minimum 20 characters)" },
      });
      return;
    }

    try {
      const config = await getAIModelForUser(req.userId!);
      if (!config) {
        res.status(503).json({
          error: { code: "AI_NOT_CONFIGURED", message: "AI is not configured. Contact the admin." },
        });
        return;
      }

      const result = await callOpenRouter(config.apiKey, config.modelId, [
        {
          role: "system",
          content: `You are a resume parser. Convert the provided resume text into clean markdown format.

Rules:
- Use # for the person's name
- Use ## for section headers (Experience, Education, Skills, etc.)
- Use ### for job titles or subsection headers
- Use - for bullet points
- Use **bold** for company names and key terms
- Use *italics* for dates and locations
- Preserve ALL original content — do not add or remove information
- Clean up formatting artifacts (extra spaces, broken lines, etc.)
- Output ONLY the markdown, no commentary`,
        },
        {
          role: "user",
          content: text,
        },
      ], 4096);

      const markdown = result.replace(/^```(?:markdown)?\n?/g, "").replace(/\n?```$/g, "").trim();
      res.json({ markdown });
    } catch (err) {
      logger.error("ai/import-text error:", err);
      const message = err instanceof Error ? err.message : "Failed to parse resume. Please try again.";
      const status = (err as Error & { statusCode?: number }).statusCode === 429 ? 429 : 500;
      res.status(status).json({
        error: { code: "AI_ERROR", message },
      });
    }
  }
);

export default router;
