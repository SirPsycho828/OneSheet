import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import pdfRoutes from "./routes/pdf";
import profileRoutes from "./routes/profile";
import resumeRoutes from "./routes/resumes";
import versionRoutes from "./routes/versions";
import stripeRoutes from "./routes/stripe";
import { cleanupVersions } from "./scheduled/cleanupVersions";
import { stripeSecretKey, stripeWebhookSecret, stripeProPriceId } from "./config";

export { cleanupVersions };

admin.initializeApp();

const app = express();

// CORS: allow bragsheet.io and localhost dev
app.use(cors({
  origin: [
    /bragsheet\.io$/,
    /localhost:\d+$/,
  ],
}));

// JSON body parser (except for Stripe webhook which needs raw body)
app.use((req, res, next) => {
  if (req.path === "/api/stripe/webhook") {
    next(); // Skip JSON parsing for Stripe (needs raw body)
  } else {
    express.json()(req, res, next);
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/pdf", pdfRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/resumes/:resumeId/versions", versionRoutes);
app.use("/api/stripe", stripeRoutes);

// Export as Firebase Function
export const api = onRequest(
  {
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 60,
    concurrency: 1,
    secrets: [stripeSecretKey, stripeWebhookSecret, stripeProPriceId],
  },
  app
);
