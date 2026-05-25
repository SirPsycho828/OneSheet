import { useAuthContext } from "../contexts/AuthContext";

/**
 * Returns the current auth state, Firestore user document, and raw Firebase user.
 * Must be used inside <AuthProvider>.
 */
export function useAuth() {
  return useAuthContext();
}
