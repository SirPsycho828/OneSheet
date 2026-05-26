import { Router, Response } from "express";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { ADMIN_EMAIL } from "../lib/constants";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  const [keyDoc, aiDoc, userDoc, authUser, adminDoc] = await Promise.all([
    db.collection("config").doc("openrouter").get(),
    db.collection("config").doc("ai").get(),
    db.collection("users").doc(userId).get(),
    admin.auth().getUser(userId),
    db.collection("config").doc("admin").get(),
  ]);

  const apiKey = keyDoc.data()?.apiKey as string | undefined;
  if (!apiKey) return null;

  const aiData = aiDoc.data();
  const freeModelId = aiData?.freeModelId as string | undefined;
  const proModelId = aiData?.proModelId as string | undefined;
  // Fallback: legacy single-model config
  const legacyModelId = aiData?.activeModelId as string | undefined;

  const subscriptionStatus: string =
    userDoc.data()?.subscription?.status ?? "free";
  const isAdmin = authUser.email === ADMIN_EMAIL;

  // Admin can override their entire account tier via config/admin.tierOverride
  const tierOverride = adminDoc.data()?.tierOverride as string | undefined;
  const isPro = isAdmin
    ? tierOverride !== "free" // admin defaults to pro unless explicitly set to "free"
    : subscriptionStatus === "active";

  // Pro users and admin get the pro model, free users get the free model
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
    logger.error("OpenRouter API error:", response.status, errorBody);

    // Parse OpenRouter error for user-friendly message
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
      const blocked =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "0.0.0.0" ||
        hostname === "::1" ||
        hostname.endsWith(".local") ||
        /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(hostname);
      if (blocked || !["http:", "https:"].includes(parsed.protocol)) {
        res.status(400).json({
          error: { code: "INVALID_URL", message: "URL not allowed" },
        });
        return;
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
