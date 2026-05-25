import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import type { User, AuthState } from "../types/user";

interface AuthContextValue {
  authState: AuthState;
  user: User | null;
  firebaseUser: FirebaseUser | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setFirebaseUser(null);
        setUser(null);
        setAuthState("unauthenticated");
        return;
      }

      setFirebaseUser(fbUser);

      try {
        const userDocRef = doc(db, "users", fbUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          // No users document at all — needs onboarding
          setUser(null);
          setAuthState("needs_onboarding");
          return;
        }

        const userData = userDoc.data() as User;

        if (!userData.onboardingComplete || !userData.username) {
          // Has doc but hasn't completed onboarding
          setUser(userData);
          setAuthState("needs_onboarding");
          return;
        }

        // Email/password users must verify their email
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
        console.error("AuthContext: error fetching user doc", error);
        setUser(null);
        setAuthState("unauthenticated");
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ authState, user, firebaseUser }}>
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
