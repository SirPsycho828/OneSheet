import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import type { User, AuthState } from "../types/user";

import { ADMIN_EMAIL } from "../constants/admin";

interface AuthContextValue {
  authState: AuthState;
  user: User | null;
  firebaseUser: FirebaseUser | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const evaluateUser = useCallback(async (fbUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, "users", fbUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        setUser(null);
        setAuthState("needs_onboarding");
        return;
      }

      let userData = { ...userDoc.data(), uid: fbUser.uid } as User;

      // Admin tier override: force subscription status for testing
      if (fbUser.email === ADMIN_EMAIL) {
        try {
          const adminSnap = await getDoc(doc(db, "config", "admin"));
          const tierOverride = adminSnap.data()?.tierOverride as string | undefined;
          if (tierOverride === "free" || tierOverride === "pro") {
            userData = {
              ...userData,
              subscription: {
                ...userData.subscription,
                status: tierOverride === "pro" ? "active" : "free",
              },
            };
          }
        } catch {
          // If config/admin doesn't exist, default to real subscription
        }
      }

      if (!userData.onboardingComplete || !userData.username) {
        setUser(userData);
        setAuthState("needs_onboarding");
        return;
      }

      const isEmailProvider = fbUser.providerData.some(
        (p) => p.providerId === "password"
      );
      if (isEmailProvider && !fbUser.emailVerified) {
        setUser(userData);
        setAuthState("unverified");
        return;
      }

      setUser(userData);
      setAuthState("authenticated");
    } catch (error) {

      setUser(null);
      setAuthState("unauthenticated");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setFirebaseUser(null);
        setUser(null);
        setAuthState("unauthenticated");
        return;
      }

      setFirebaseUser(fbUser);
      await evaluateUser(fbUser);
    });

    return unsubscribe;
  }, [evaluateUser]);

  const refreshUser = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return;
    setFirebaseUser(fbUser);
    await evaluateUser(fbUser);
  }, [evaluateUser]);

  return (
    <AuthContext.Provider value={{ authState, user, firebaseUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return ctx;
}
