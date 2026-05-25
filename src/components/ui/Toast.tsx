import * as React from "react";
import { X, CheckCircle, XCircle, Info } from "lucide-react";
import { useToastContext } from "../../contexts/ToastContext";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  /** Whether this toast is currently animating out */
  leaving?: boolean;
}

// ---------------------------------------------------------------------------
// Single Toast card
// ---------------------------------------------------------------------------

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const variantStyles: Record<
  ToastVariant,
  { border: string; icon: React.ReactNode }
> = {
  success: {
    border: "border-l-4 border-success",
    icon: (
      <CheckCircle
        className="w-5 h-5 text-success flex-shrink-0"
        strokeWidth={1.5}
      />
    ),
  },
  error: {
    border: "border-l-4 border-error",
    icon: (
      <XCircle
        className="w-5 h-5 text-error flex-shrink-0"
        strokeWidth={1.5}
      />
    ),
  },
  info: {
    border: "border-l-4 border-brand-500",
    icon: (
      <Info
        className="w-5 h-5 text-brand-500 flex-shrink-0"
        strokeWidth={1.5}
      />
    ),
  },
};

function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const { border, icon } = variantStyles[toast.variant];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        "flex items-start gap-3 bg-white rounded-lg shadow-lg px-4 py-3 max-w-sm w-full",
        border,
        "transition-all",
        toast.leaving
          ? "opacity-0 duration-150"
          : "opacity-100 translate-x-0 duration-200",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon}
      <p className="flex-1 text-sm text-gray-950 leading-snug">
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="ml-1 -mt-0.5 p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <X className="w-4 h-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast container — renders all active toasts
// ---------------------------------------------------------------------------

export function ToastContainer() {
  const { toasts, removeToast } = useToastContext();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}
