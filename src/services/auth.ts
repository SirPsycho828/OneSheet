import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
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
  constructor(public readonly email: string) {
    super(
      `An account with this email already exists. Sign in with your original method to link your accounts.`
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
      throw new AccountExistsError(email ?? "");
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
      throw new AccountExistsError(email ?? "");
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
