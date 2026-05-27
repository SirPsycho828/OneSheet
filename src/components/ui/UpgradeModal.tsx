import * as React from "react";
import { Check, Sparkles } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { createCheckoutSession } from "../../services/stripe";
import { useToast } from "../../hooks/useToast";
import { PRO_PRICE_MONTHLY } from "../../constants/pricing";

const PRO_FEATURES = [
  "Up to 3 resume variants",
  "PDF export (ATS-optimized)",
  "AI bullet polish + job match",
  "Custom QR code on profile",
  "No OneSheet branding",
  "API access for agents",
];

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const toast = useToast();

  async function handleUpgrade() {
    setIsLoading(true);
    try {
      await createCheckoutSession();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start checkout.";
      toast.error(message);
      setIsLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center mb-5">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 mb-3">
          <Sparkles className="w-5 h-5 text-accent" strokeWidth={1.5} />
        </div>
        <h2 className="font-heading text-xl font-semibold text-foreground tracking-tight">
          Upgrade to Pro
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          ${PRO_PRICE_MONTHLY}/mo &middot; Cancel anytime
        </p>
      </div>

      <ul className="space-y-2.5 mb-6">
        {PRO_FEATURES.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5 text-sm text-foreground">
            <Check className="w-4 h-4 text-accent flex-shrink-0" strokeWidth={2} />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        variant="primary"
        className="w-full"
        size="large"
        onClick={handleUpgrade}
        isLoading={isLoading}
      >
        Upgrade to Pro
      </Button>

      <button
        type="button"
        onClick={onClose}
        className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Maybe later
      </button>
    </Modal>
  );
}
