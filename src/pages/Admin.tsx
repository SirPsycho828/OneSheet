import * as React from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Star, Check } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useToast } from "../hooks/useToast";
import {
  getOpenRouterKey,
  setOpenRouterKey,
  getAIConfig,
  setFreeModel,
  setProModel,
  setFavoriteModels,
  getAdminTierOverride,
  setAdminTierOverride,
} from "../services/adminConfig";
import { useAuth } from "../hooks/useAuth";
import { fetchModels } from "../services/openrouter";
import type { OpenRouterModel } from "../services/openrouter";
import type { AIConfig } from "../services/adminConfig";

// ---------------------------------------------------------------------------
// Admin Nav
// ---------------------------------------------------------------------------

function AdminNav() {
  return (
    <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-card/90 backdrop-blur-sm flex-shrink-0">
      <Link
        to="/dashboard"
        className="text-sm font-semibold font-heading tracking-tight text-foreground hover:text-primary transition-colors flex-shrink-0"
      >
        OneSheet
      </Link>
      <div className="w-px h-5 bg-border flex-shrink-0" aria-hidden />
      <span className="text-sm font-medium text-muted-foreground flex-1">Admin</span>
    </header>
  );
}

// ---------------------------------------------------------------------------
// API Key Card
// ---------------------------------------------------------------------------

function ApiKeyCard() {
  const toast = useToast();
  const [key, setKey] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const existing = await getOpenRouterKey();
        if (existing) setKey(existing);
      } catch {
        // not configured yet
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function handleSave() {
    if (!key.trim()) return;
    setIsSaving(true);
    try {
      await setOpenRouterKey(key.trim());
      toast.success("API key saved");
    } catch {
      toast.error("Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-3" />
        <div className="h-9 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <label className="text-sm font-medium text-muted-foreground block mb-2">
        OpenRouter API Key
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-or-..."
            className="w-full h-9 px-3 pr-9 text-sm font-mono rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={show ? "Hide key" : "Show key"}
          >
            {show ? (
              <EyeOff className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <Eye className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          className="text-sm"
          disabled={!key.trim()}
        >
          Save
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">
        Used for AI features (bullet polish, job scoring, resume import).
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Model Selector Card
// ---------------------------------------------------------------------------

function ModelSelectorCard() {
  const toast = useToast();
  const [models, setModels] = React.useState<OpenRouterModel[]>([]);
  const [aiConfig, setAiConfig] = React.useState<AIConfig>({
    freeModelId: null,
    freeModelName: null,
    proModelId: null,
    proModelName: null,
    favoriteModelIds: [],
  });
  const [isLoadingModels, setIsLoadingModels] = React.useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = React.useState(true);
  const [filter, setFilter] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const config = await getAIConfig();
        setAiConfig(config);
      } catch {
        // not configured yet
      } finally {
        setIsLoadingConfig(false);
      }
    })();
  }, []);

  async function handleFetchModels() {
    setIsLoadingModels(true);
    try {
      const apiKey = await getOpenRouterKey();
      if (!apiKey) {
        toast.error("Set an OpenRouter API key first");
        return;
      }
      const result = await fetchModels(apiKey);
      setModels(result);
    } catch {
      toast.error("Failed to fetch models");
    } finally {
      setIsLoadingModels(false);
    }
  }

  async function handleSetFree(model: OpenRouterModel) {
    try {
      await setFreeModel(model.id, model.name);
      setAiConfig((prev) => ({
        ...prev,
        freeModelId: model.id,
        freeModelName: model.name,
      }));
      toast.success(`Free tier model: ${model.name}`);
    } catch {
      toast.error("Failed to set free model");
    }
  }

  async function handleSetPro(model: OpenRouterModel) {
    try {
      await setProModel(model.id, model.name);
      setAiConfig((prev) => ({
        ...prev,
        proModelId: model.id,
        proModelName: model.name,
      }));
      toast.success(`Pro tier model: ${model.name}`);
    } catch {
      toast.error("Failed to set pro model");
    }
  }

  async function handleToggleFavorite(modelId: string) {
    const isFav = aiConfig.favoriteModelIds.includes(modelId);
    const next = isFav
      ? aiConfig.favoriteModelIds.filter((id) => id !== modelId)
      : [...aiConfig.favoriteModelIds, modelId];

    try {
      await setFavoriteModels(next);
      setAiConfig((prev) => ({ ...prev, favoriteModelIds: next }));
    } catch {
      toast.error("Failed to update favorites");
    }
  }

  const filteredModels = filter
    ? models.filter(
        (m) =>
          m.name.toLowerCase().includes(filter.toLowerCase()) ||
          m.id.toLowerCase().includes(filter.toLowerCase())
      )
    : models;

  const favorites = filteredModels.filter((m) =>
    aiConfig.favoriteModelIds.includes(m.id)
  );
  const freeModels = filteredModels.filter(
    (m) =>
      m.pricing.prompt === "0" &&
      !aiConfig.favoriteModelIds.includes(m.id)
  );
  const otherModels = filteredModels.filter(
    (m) =>
      m.pricing.prompt !== "0" &&
      !aiConfig.favoriteModelIds.includes(m.id)
  );

  function renderModelRow(model: OpenRouterModel) {
    const isFree = model.id === aiConfig.freeModelId;
    const isPro = model.id === aiConfig.proModelId;
    const isFav = aiConfig.favoriteModelIds.includes(model.id);
    const promptCost = parseFloat(model.pricing.prompt);
    const costLabel =
      promptCost === 0
        ? "Free"
        : `$${(promptCost * 1_000_000).toFixed(2)}/M tokens`;

    return (
      <div
        key={model.id}
        className={`flex items-center gap-2 px-3 py-2 text-xs border-b border-border last:border-0 ${
          isFree ? "bg-success/10" : isPro ? "bg-secondary" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => handleToggleFavorite(model.id)}
          className={`flex-shrink-0 ${isFav ? "text-amber-500" : "text-muted-foreground hover:text-amber-400"}`}
          title={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          <Star className="w-3.5 h-3.5" fill={isFav ? "currentColor" : "none"} strokeWidth={1.5} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-foreground truncate font-medium">{model.name}</p>
            {isFree && (
              <span className="flex-shrink-0 text-[10px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                FREE TIER
              </span>
            )}
            {isPro && (
              <span className="flex-shrink-0 text-[10px] font-semibold bg-secondary text-primary px-1.5 py-0.5 rounded">
                PRO TIER
              </span>
            )}
          </div>
          <p className="text-muted-foreground truncate">{model.id}</p>
        </div>
        <span className="text-muted-foreground flex-shrink-0 text-right w-28">
          {costLabel}
        </span>
        <span className="text-muted-foreground flex-shrink-0 w-14 text-right">
          {Math.round(model.context_length / 1000)}K
        </span>
        <div className="flex gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleSetFree(model)}
            disabled={isFree}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              isFree
                ? "bg-green-100 text-green-700"
                : "bg-muted text-muted-foreground hover:bg-success/10 hover:text-success"
            }`}
            title="Set as Free tier model"
          >
            {isFree ? (
              <span className="flex items-center gap-0.5">
                <Check className="w-3 h-3" strokeWidth={2} />
                Free
              </span>
            ) : (
              "Free"
            )}
          </button>
          <button
            type="button"
            onClick={() => handleSetPro(model)}
            disabled={isPro}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              isPro
                ? "bg-secondary text-primary"
                : "bg-muted text-muted-foreground hover:bg-secondary hover:text-primary"
            }`}
            title="Set as Pro tier model"
          >
            {isPro ? (
              <span className="flex items-center gap-0.5">
                <Check className="w-3 h-3" strokeWidth={2} />
                Pro
              </span>
            ) : (
              "Pro"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      {/* Active models display */}
      {!isLoadingConfig && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-success/10 rounded-md border border-green-200">
            <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-1">
              Free Tier Model
            </p>
            <p className="text-sm font-medium text-foreground truncate">
              {aiConfig.freeModelName ?? "Not configured"}
            </p>
            {aiConfig.freeModelId && (
              <p className="text-[10px] text-muted-foreground font-mono truncate">{aiConfig.freeModelId}</p>
            )}
          </div>
          <div className="p-3 bg-secondary rounded-md border border-primary/20">
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">
              Pro Tier Model
            </p>
            <p className="text-sm font-medium text-foreground truncate">
              {aiConfig.proModelName ?? "Not configured"}
            </p>
            {aiConfig.proModelId && (
              <p className="text-[10px] text-muted-foreground font-mono truncate">{aiConfig.proModelId}</p>
            )}
          </div>
        </div>
      )}

      {/* Fetch models */}
      <div className="flex items-center gap-2 mb-3">
        <Button
          variant="secondary"
          onClick={handleFetchModels}
          isLoading={isLoadingModels}
          className="text-sm"
        >
          {models.length > 0 ? "Refresh Models" : "Fetch Models"}
        </Button>
        {models.length > 0 && (
          <span className="text-xs text-muted-foreground">{models.length} models</span>
        )}
      </div>

      {models.length > 0 && (
        <>
          {/* Search filter */}
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter models..."
            className="w-full h-8 px-3 text-xs rounded-md border border-input mb-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />

          <p className="text-xs text-muted-foreground mb-2">
            Click <strong>Free</strong> or <strong>Pro</strong> to assign a model to each tier. Free users get the Free model; Pro subscribers get the Pro model.
          </p>

          {/* Model list */}
          <div className="max-h-96 overflow-y-auto border border-border rounded-md">
            {favorites.length > 0 && (
              <>
                <div className="px-3 py-1.5 bg-amber-50 text-xs font-semibold text-amber-700 sticky top-0 z-10">
                  Favorites
                </div>
                {favorites.map(renderModelRow)}
              </>
            )}
            {freeModels.length > 0 && (
              <>
                <div className="px-3 py-1.5 bg-success/10 text-xs font-semibold text-green-700 sticky top-0 z-10">
                  Free Models
                </div>
                {freeModels.map(renderModelRow)}
              </>
            )}
            {otherModels.length > 0 && (
              <>
                <div className="px-3 py-1.5 bg-muted text-xs font-semibold text-muted-foreground sticky top-0 z-10">
                  All Models
                </div>
                {otherModels.map(renderModelRow)}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin Tier Override Card
// ---------------------------------------------------------------------------

function AdminTierCard() {
  const toast = useToast();
  const { refreshUser } = useAuth();
  const [tier, setTier] = React.useState<"free" | "pro">("pro");
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const override = await getAdminTierOverride();
        setTier(override);
      } catch {
        // default to pro
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function handleToggle() {
    const next = tier === "pro" ? "free" : "pro";
    try {
      await setAdminTierOverride(next);
      setTier(next);
      // Refresh the user so AuthContext picks up the override immediately
      await refreshUser();
      toast.success(
        next === "pro"
          ? "Switched to Pro: full paid experience"
          : "Switched to Free: seeing what free users see"
      );
    } catch {
      toast.error("Failed to update tier");
    }
  }

  if (isLoading) return null;

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Account Experience</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Switch your entire account between Free and Pro for testing.
            Affects AI models, templates, PDF export, QR customization, and all gated features.
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={`relative inline-flex h-7 w-[88px] items-center rounded-full transition-colors ${
            tier === "pro" ? "bg-primary" : "bg-green-500"
          }`}
        >
          <span className="sr-only">Toggle tier</span>
          <span
            className={`absolute text-[10px] font-bold text-primary-foreground uppercase tracking-wider ${
              tier === "pro" ? "left-2.5" : "right-3"
            }`}
          >
            {tier === "pro" ? "Pro" : "Free"}
          </span>
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform ${
              tier === "pro" ? "translate-x-[64px]" : "translate-x-[4px]"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin Page
// ---------------------------------------------------------------------------

export function Admin() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AdminNav />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-lg font-semibold text-foreground mb-6">
          Admin Settings
        </h1>

        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Testing
          </h2>
          <AdminTierCard />
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            AI Configuration
          </h2>
          <div className="flex flex-col gap-4">
            <ApiKeyCard />
            <ModelSelectorCard />
          </div>
        </section>
      </main>
    </div>
  );
}
