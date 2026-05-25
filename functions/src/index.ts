import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";

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

// TODO: Routes will be added in Tasks 12-19
// app.use("/api/pdf", pdfRoutes);
// app.use("/api/profile", profileRoutes);
// app.use("/api/stripe", stripeRoutes);
// etc.

// Export as Firebase Function
export const api = onRequest(
  {
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  app
);
