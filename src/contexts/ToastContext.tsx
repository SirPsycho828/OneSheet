import * as React from "react";
import type { ToastItem, ToastVariant } from "../components/ui/Toast";

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (message: string, variant: ToastVariant) => string;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

let nextId = 0;

/** Auto-dismiss duration in ms. Errors are persistent (0 = no auto-dismiss). */
const AUTO_DISMISS_MS: Record<ToastVariant, number> = {
  success: 4000,
  info: 4000,
  error: 0,
};

/** How long the leave animation plays before the item is removed from DOM. */
const LEAVE_ANIMATION_MS = 150;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: string) => {
    // Mark as leaving first (triggers fade-out animation)
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    // Then remove from DOM after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, LEAVE_ANIMATION_MS);
  }, []);

  const addToast = React.useCallback(
    (message: string, variant: ToastVariant): string => {
      const id = `toast-${++nextId}`;
      setToasts((prev) => [...prev, { id, message, variant, leaving: false }]);

      const delay = AUTO_DISMISS_MS[variant];
      if (delay > 0) {
        setTimeout(() => removeToast(id), delay);
      }

      return id;
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return ctx;
}
