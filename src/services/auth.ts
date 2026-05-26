import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  linkWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  AuthError,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
githubProvider.addScope("user:email");

export class AccountExistsError extends Error {
  constructor(
    public readonly email: string,
    public readonly attemptedProvider: "google" | "github"
  ) {
    const alternatives =
      attemptedProvider === "google"
        ? "GitHub or email/password"
        : "Google or email/password";
    super(
      `An account with ${email || "this email"} already exists. Try signing in with ${alternatives}, then link accounts in Settings.`
    );
    this.name = "AccountExistsError";
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Send verification email
  await sendEmailVerification(user);

  // Create users document with onboardingComplete: false
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email ?? email,
    displayName: email.split("@")[0],
    username: "",
    photoURL: null,
    onboardingComplete: false,
    subscription: {
      status: "free",
      stripeCustomerId: null,
      stripePriceId: null,
      currentPeriodEnd: null,
    },
    paperSize: "us-letter",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle(): Promise<void> {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    const authError = err as AuthError;
    if (authError.code === "auth/account-exists-with-different-credential") {
      const email = authError.customData?.email as string | undefined;
      throw new AccountExistsError(email ?? "", "google");
    }
    throw err;
  }
}

export async function signInWithGithub(): Promise<void> {
  try {
    await signInWithPopup(auth, githubProvider);
  } catch (err) {
    const authError = err as AuthError;
    if (authError.code === "auth/account-exists-with-different-credential") {
      const email = authError.customData?.email as string | undefined;
      throw new AccountExistsError(email ?? "", "github");
    }
    throw err;
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function sendVerification(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  await sendEmailVerification(user);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export function getLinkedProviders(): string[] {
  return auth.currentUser?.providerData.map((p) => p.providerId) ?? [];
}

export async function linkGoogle(): Promise<void> {
  if (!auth.currentUser) throw new Error("Not authenticated");
  await linkWithPopup(auth.currentUser, googleProvider);
}

export async function linkGithub(): Promise<void> {
  if (!auth.currentUser) throw new Error("Not authenticated");
  await linkWithPopup(auth.currentUser, githubProvider);
}
