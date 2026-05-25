import * as React from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { db } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { createCheckoutSession, createPortalSession } from "../../services/stripe";
import { PRO_PRICE_MONTHLY } from "../../constants/pricing";
import type { Timestamp } from "firebase/firestore";

function formatDate(ts: Timestamp | null | undefined): string {
  if (!ts) return "";
  const date = ts.toDate();
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const FREE_FEATURES = [
  "1 resume variant",
  "All templates",
  "Public profile link",
  "Markdown editor",
];

const PRO_FEATURES = [
  "Up to 3 resume variants",
  "PDF export",
  "All templates",
  "Public profile link",
  "Markdown editor",
];

interface SubscriptionCardProps {
  /** Called after a successful upgrade poll to refresh auth context */
  onSubscriptionActive?: () => void;
  /** Whether to start polling immediately (post-checkout success) */
  pollOnMount?: boolean;
}

export function SubscriptionCard({ onSubscriptionActive, pollOnMount = false }: SubscriptionCardProps) {
  const { user, firebaseUser } = useAuth();
  const toast = useToast();

  const [isLoadingCheckout, setIsLoadingCheckout] = React.useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = React.useState(false);
  const [isPolling, setIsPolling] = React.useState(false);

  const subscription = user?.subscription;
  const status = subscription?.status ?? "free";
  const cancelAtPeriodEnd: boolean =
    (subscription as (typeof subscription & { cancelAtPeriodEnd?: boolean }) | undefined)?.cancelAtPeriodEnd ?? false;

  // Poll for subscription activation after checkout success
  React.useEffect(() => {
    if (!pollOnMount) return;
    if (status === "active") {
      onSubscriptionActive?.();
      return;
    }

    setIsPolling(true);
    let attempts = 0;
    const MAX_ATTEMPTS = 5; // 5 × 2s = 10s

    const interval = setInterval(async () => {
      attempts += 1;

      // Force-refresh the Firebase ID token to get latest custom claims,
      // then re-fetch user doc by reloading the page (simplest approach given
      // AuthContext uses onAuthStateChanged which doesn't re-trigger on doc updates)
      try {
        await firebaseUser?.reload();
        // Re-read user doc to check status
        if (user?.uid) {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            if (data?.subscription?.status === "active") {
              clearInterval(interval);
              setIsPolling(false);
              onSubscriptionActive?.();
              return;
            }
          }
        }
      } catch {
        // ignore polling errors
      }

      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(interval);
        setIsPolling(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pollOnMount]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpgrade() {
    setIsLoadingCheckout(true);
    try {
      await createCheckoutSession();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start checkout.";
      toast.error(message);
      setIsLoadingCheckout(false);
    }
  }

  async function handleManage() {
    setIsLoadingPortal(true);
    try {
      await createPortalSession();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to open billing portal.";
      toast.error(message);
      setIsLoadingPortal(false);
    }
  }

  // ----- Render helpers -----

  function renderBadge() {
    if (status === "free") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          Free
        </span>
      );
    }
    if (status === "active" && cancelAtPeriodEnd) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pro (canceling)
        </span>
      );
    }
    if (status === "active") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
          Pro
        </span>
      );
    }
    if (status === "past_due") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <AlertTriangle className="w-3 h-3" strokeWidth={2} />
          Past Due
        </span>
      );
    }
    return null;
  }

  function renderPeriodLine() {
    if (status === "active" && cancelAtPeriodEnd && subscription?.currentPeriodEnd) {
      return (
        <p className="text-sm text-gray-500 mt-1">
          Active until {formatDate(subscription.currentPeriodEnd)}
        </p>
      );
    }
    if (status === "active" && !cancelAtPeriodEnd && subscription?.currentPeriodEnd) {
      return (
        <p className="text-sm text-gray-500 mt-1">
          Renews {formatDate(subscription.currentPeriodEnd)}
        </p>
      );
    }
    return null;
  }

  function renderPastDueBanner() {
    if (status !== "past_due") return null;
    return (
      <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 mb-4">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={2} />
        <p>
          Your last payment failed. Update your payment method to keep access to Pro features.
        </p>
      </div>
    );
  }

  function renderFeatureList() {
    const features = status === "active" ? PRO_FEATURES : FREE_FEATURES;
    return (
      <ul className="space-y-1.5 mb-4">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" strokeWidth={2} />
            {f}
          </li>
        ))}
      </ul>
    );
  }

  function renderAction() {
    if (isPolling) {
      return (
        <Button variant="primary" isLoading disabled>
          Activating your plan...
        </Button>
      );
    }

    if (status === "free") {
      return (
        <Button
          variant="primary"
          onClick={handleUpgrade}
          isLoading={isLoadingCheckout}
        >
          Upgrade to Pro — ${PRO_PRICE_MONTHLY}/mo
        </Button>
      );
    }

    if (status === "active" && cancelAtPeriodEnd) {
      return (
        <Button
          variant="secondary"
          onClick={handleManage}
          isLoading={isLoadingPortal}
        >
          Resubscribe
        </Button>
      );
    }

    if (status === "active") {
      return (
        <Button
          variant="secondary"
          onClick={handleManage}
          isLoading={isLoadingPortal}
        >
          Manage Subscription
        </Button>
      );
    }

    if (status === "past_due") {
      return (
        <Button
          variant="danger"
          onClick={handleManage}
          isLoading={isLoadingPortal}
        >
          Update Payment
        </Button>
      );
    }

    return null;
  }

  return (
    <Card className="max-w-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Subscription</h2>
          <div className="flex items-center gap-2 mt-1">
            {renderBadge()}
          </div>
          {renderPeriodLine()}
        </div>
      </div>

      {renderPastDueBanner()}
      {renderFeatureList()}
      {renderAction()}
    </Card>
  );
}
