import { defineSecret } from "firebase-functions/params";

// These will be set via Firebase Functions secrets
export const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
export const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
export const stripeProPriceId = defineSecret("STRIPE_PRO_PRICE_ID");
