import { Router, Response, Request } from "express";
import * as admin from "firebase-admin";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const StripeLib = require("stripe");
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { stripeSecretKey, stripeWebhookSecret, stripeProPriceId } from "../config";

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStripe(): any {
  const key = stripeSecretKey.value();
  return new StripeLib(key, { apiVersion: "2026-04-22.dahlia" });
}

/**
 * POST /api/stripe/create-checkout-session
 *
 * Creates a Stripe Checkout Session for a Pro subscription.
 * Requires authentication.
 */
router.post(
  "/create-checkout-session",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const db = admin.firestore();

    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        res.status(403).json({
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });
        return;
      }

      const userData = userDoc.data()!;
      const userEmail: string = userData.email ?? "";

      const priceId: string =
        (req.body as { priceId?: string }).priceId ?? stripeProPriceId.value();

      if (!priceId) {
        res.status(400).json({
          error: { code: "MISSING_PRICE_ID", message: "No price ID configured" },
        });
        return;
      }

      const origin =
        (req.headers.origin as string | undefined) ??
        "https://onesheet.cv";

      const stripe = getStripe();

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: userEmail,
        client_reference_id: userId,
        metadata: { firebaseUid: userId },
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/settings?checkout=success`,
        cancel_url: `${origin}/settings?checkout=canceled`,
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (err) {
      console.error("stripe/create-checkout-session: error", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to create checkout session" },
      });
    }
  }
);

/**
 * POST /api/stripe/create-portal-session
 *
 * Creates a Stripe Billing Portal session so the customer can manage
 * their subscription. Requires authentication.
 */
router.post(
  "/create-portal-session",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const db = admin.firestore();

    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        res.status(403).json({
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });
        return;
      }

      const userData = userDoc.data()!;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stripeCustomerId: string | null =
        (userData as any)?.subscription?.stripeCustomerId ?? null;

      if (!stripeCustomerId) {
        res.status(400).json({
          error: {
            code: "NO_CUSTOMER",
            message: "No Stripe customer found. Please subscribe first.",
          },
        });
        return;
      }

      const origin =
        (req.headers.origin as string | undefined) ??
        "https://onesheet.cv";

      const stripe = getStripe();

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${origin}/settings`,
      });

      res.json({ url: portalSession.url });
    } catch (err) {
      console.error("stripe/create-portal-session: error", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to create portal session" },
      });
    }
  }
);

/**
 * POST /api/stripe/webhook
 *
 * Receives Stripe webhook events. No auth — verified via Stripe signature.
 * Uses raw body (JSON parsing is skipped for this route in index.ts).
 */
router.post(
  "/webhook",
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers["stripe-signature"] as string | undefined;
    const webhookSec = stripeWebhookSecret.value();

    if (!sig) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event: any;

    try {
      // Firebase Functions v2 exposes rawBody on the request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawBody: Buffer | string = (req as any).rawBody ?? req.body;
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSec);
    } catch (err) {
      console.error("stripe/webhook: signature verification failed", err);
      res.status(400).json({ error: "Webhook signature verification failed" });
      return;
    }

    const db = admin.firestore();

    // Idempotency: skip already-processed events
    const eventRef = db.collection("stripeEvents").doc(event.id);
    try {
      const eventDoc = await eventRef.get();
      if (eventDoc.exists) {
        res.json({ received: true });
        return;
      }
    } catch {
      // If we can't check, proceed anyway — we'll mark it after
    }

    try {
      await handleStripeEvent(event, db);
      // Mark event as processed
      await eventRef.set({
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        type: event.type,
      });
    } catch (err) {
      console.error(`stripe/webhook: error handling ${event.type}`, err);
      // Still return 200 so Stripe doesn't retry — log the error
    }

    res.json({ received: true });
  }
);

async function handleStripeEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: any,
  db: admin.firestore.Firestore
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const uid: string | null =
        session.metadata?.firebaseUid ?? session.client_reference_id ?? null;
      if (!uid) {
        console.warn("checkout.session.completed: no firebaseUid in metadata");
        return;
      }

      const customerId: string | null = session.customer ?? null;
      const subscriptionId: string | null = session.subscription ?? null;

      // Fetch subscription to get price and period end
      let stripePriceId: string | null = null;
      let currentPeriodEnd: admin.firestore.Timestamp | null = null;
      if (subscriptionId) {
        try {
          const stripe = getStripe();
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          stripePriceId = subscription.items?.data?.[0]?.price?.id ?? null;
          const periodEnd: number = subscription.current_period_end;
          currentPeriodEnd = admin.firestore.Timestamp.fromMillis(periodEnd * 1000);
        } catch (err) {
          console.warn("checkout.session.completed: could not fetch subscription", err);
        }
      }

      const batch = db.batch();

      // Update users/{uid}
      const userRef = db.collection("users").doc(uid);
      batch.update(userRef, {
        "subscription.status": "active",
        "subscription.stripeCustomerId": customerId,
        "subscription.stripePriceId": stripePriceId,
        "subscription.currentPeriodEnd": currentPeriodEnd,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create/merge customers/{uid}
      const customerRef = db.collection("customers").doc(uid);
      batch.set(
        customerRef,
        {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const customerId: string = subscription.customer;

      const uid = await getUidByCustomerId(db, customerId);
      if (!uid) {
        console.warn(
          "customer.subscription.updated: no user found for customer",
          customerId
        );
        return;
      }

      const status = mapStripeStatus(subscription.status);
      const currentPeriodEnd = admin.firestore.Timestamp.fromMillis(
        subscription.current_period_end * 1000
      );
      const cancelAtPeriodEnd: boolean =
        subscription.cancel_at_period_end ?? false;

      await db.collection("users").doc(uid).update({
        "subscription.status": status,
        "subscription.currentPeriodEnd": currentPeriodEnd,
        "subscription.cancelAtPeriodEnd": cancelAtPeriodEnd,
        "subscription.stripePriceId":
          subscription.items?.data?.[0]?.price?.id ?? null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerId: string = subscription.customer;

      const uid = await getUidByCustomerId(db, customerId);
      if (!uid) {
        console.warn(
          "customer.subscription.deleted: no user found for customer",
          customerId
        );
        return;
      }

      await db.collection("users").doc(uid).update({
        "subscription.status": "free",
        "subscription.stripeCustomerId": null,
        "subscription.stripePriceId": null,
        "subscription.currentPeriodEnd": null,
        "subscription.cancelAtPeriodEnd": false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId: string = invoice.customer;

      const uid = await getUidByCustomerId(db, customerId);
      if (!uid) {
        console.warn(
          "invoice.payment_failed: no user found for customer",
          customerId
        );
        return;
      }

      await db.collection("users").doc(uid).update({
        "subscription.status": "past_due",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      break;
    }

    default:
      // Unknown event — log and ignore
      console.log(`stripe/webhook: unhandled event type ${event.type}`);
  }
}

/**
 * Maps a Stripe subscription status to our internal status type.
 */
function mapStripeStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "free";
    default:
      return "free";
  }
}

/**
 * Looks up our Firebase UID for a given Stripe customer ID.
 * Checks customers/{uid}.stripeCustomerId index first, then falls back
 * to a users collection query.
 */
async function getUidByCustomerId(
  db: admin.firestore.Firestore,
  customerId: string
): Promise<string | null> {
  // Try customers collection (created during checkout)
  const customerSnap = await db
    .collection("customers")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (!customerSnap.empty) {
    return customerSnap.docs[0].id;
  }

  // Fallback: users collection
  const userSnap = await db
    .collection("users")
    .where("subscription.stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (!userSnap.empty) {
    return userSnap.docs[0].id;
  }

  return null;
}

export default router;
