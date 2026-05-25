import { auth } from "../config/firebase";

const API_BASE =
  import.meta.env.VITE_FUNCTIONS_URL ??
  `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/api`;

async function getIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

/**
 * Creates a Stripe Checkout Session and redirects the user to it.
 * Pass an optional priceId to override the default Pro price.
 */
export async function createCheckoutSession(priceId?: string): Promise<void> {
  const token = await getIdToken();

  const response = await fetch(`${API_BASE}/api/stripe/create-checkout-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(priceId ? { priceId } : {}),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    const message: string =
      (json as { error?: { message?: string } })?.error?.message ??
      "Failed to start checkout. Please try again.";
    throw new Error(message);
  }

  const data = (await response.json()) as { sessionId: string; url: string };

  if (data.url) {
    window.location.href = data.url;
  } else {
    throw new Error("No checkout URL returned from server.");
  }
}

/**
 * Creates a Stripe Billing Portal session and redirects the user to it.
 */
export async function createPortalSession(): Promise<void> {
  const token = await getIdToken();

  const response = await fetch(`${API_BASE}/api/stripe/create-portal-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    const message: string =
      (json as { error?: { message?: string } })?.error?.message ??
      "Failed to open billing portal. Please try again.";
    throw new Error(message);
  }

  const data = (await response.json()) as { url: string };

  if (data.url) {
    window.location.href = data.url;
  } else {
    throw new Error("No portal URL returned from server.");
  }
}
