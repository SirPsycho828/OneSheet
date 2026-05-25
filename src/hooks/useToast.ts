import { useToastContext } from "../contexts/ToastContext";
import type { ToastVariant } from "../components/ui/Toast";

/**
 * Convenience hook for triggering toasts from any component.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success("Resume saved!");
 *   toast.error("Something went wrong.");
 *   toast.info("Your session will expire soon.");
 */
export function useToast() {
  const { addToast, removeToast } = useToastContext();

  function show(message: string, variant: ToastVariant = "info"): string {
    return addToast(message, variant);
  }

  return {
    show,
    success: (message: string) => addToast(message, "success"),
    error: (message: string) => addToast(message, "error"),
    info: (message: string) => addToast(message, "info"),
    dismiss: removeToast,
  };
}
