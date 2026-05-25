import { Timestamp } from "firebase/firestore";

export interface Subscription {
  status: "free" | "active" | "past_due" | "canceled";
  stripeCustomerId: string | null;
  stripePriceId: string | null;
  currentPeriodEnd: Timestamp | null;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  photoURL: string | null;
  onboardingComplete: boolean;
  subscription: Subscription;
  paperSize: "us-letter" | "a4";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type AuthState =
  | "loading"
  | "unauthenticated"
  | "needs_onboarding"
  | "unverified"
  | "authenticated";
