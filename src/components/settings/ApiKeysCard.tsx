import * as React from "react";
import { Copy, Check, Trash2, X, KeyRound, AlertCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { auth } from "../../config/firebase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiKeyMeta {
  keyId: string;
  name: string;
  prefix: string;
  createdAt: string | null;
  lastUsedAt: string | null;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getBearerToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function maskPrefix(prefix: string): string {
  // Show prefix then mask the rest of the key
  return `${prefix}••••••••••••••••••••••••••••••••`;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchKeys(): Promise<ApiKeyMeta[]> {
  const token = await getBearerToken();
  const res = await fetch("/api/agent/keys", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Failed to load API keys");
  }
  const data = await res.json();
  return data.keys as ApiKeyMeta[];
}

async function generateKey(name: string): Promise<{ keyId: string; key: string; prefix: string }> {
  const token = await getBearerToken();
  const res = await fetch("/api/agent/keys/generate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Failed to generate API key");
  }
  return res.json();
}

async function revokeKey(keyId: string): Promise<void> {
  const token = await getBearerToken();
  const res = await fetch(`/api/agent/keys/${keyId}/revoke`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Failed to revoke API key");
  }
}

async function deleteKey(keyId: string): Promise<void> {
  const token = await getBearerToken();
  const res = await fetch(`/api/agent/keys/${keyId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Failed to delete API key");
  }
}

// ---------------------------------------------------------------------------
// CopyButton
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the text
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-brand-600 font-medium transition-colors"
      aria-label="Copy API key"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" strokeWidth={2} />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
          Copy
        </>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// GenerateModal
// ---------------------------------------------------------------------------

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function GenerateModal({ isOpen, onClose, onCreated }: GenerateModalProps) {
  const toast = useToast();
  const [name, setName] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [newKey, setNewKey] = React.useState<string | null>(null);
  const [nameError, setNameError] = React.useState("");

  function handleClose() {
    setName("");
    setNameError("");
    setNewKey(null);
    setIsLoading(false);
    onClose();
    if (newKey) onCreated();
  }

  async function handleGenerate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Please enter a name for this key.");
      return;
    }
    setNameError("");
    setIsLoading(true);
    try {
      const result = await generateKey(trimmed);
      setNewKey(result.key);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate key.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate API Key">
      {newKey ? (
        // Step 2: Show the key once
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <p>Copy this key now. You won't be able to see it again.</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Your new API key</label>
            <div className="flex items-center gap-2 p-2.5 bg-muted rounded-md border border-border font-mono text-xs text-foreground break-all">
              <span className="flex-1 select-all">{newKey}</span>
            </div>
            <div className="mt-2">
              <CopyButton text={newKey} />
            </div>
          </div>

          <Button variant="secondary" className="w-full" onClick={handleClose}>
            Done
          </Button>
        </div>
      ) : (
        // Step 1: Enter name
        <div className="space-y-4">
          <Input
            label="Key name"
            placeholder="e.g. My automation script"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
            error={nameError}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleGenerate();
            }}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleGenerate} isLoading={isLoading}>
              Generate
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// ApiKeysCard
// ---------------------------------------------------------------------------

export function ApiKeysCard() {
  const { user } = useAuth();
  const toast = useToast();

  const isPaid = user?.subscription?.status === "active";

  const [keys, setKeys] = React.useState<ApiKeyMeta[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  // Load keys when the card mounts (only for paid users)
  React.useEffect(() => {
    if (!isPaid) return;
    loadKeys();
  }, [isPaid]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadKeys() {
    setIsLoadingKeys(true);
    try {
      const data = await fetchKeys();
      setKeys(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load API keys.";
      toast.error(msg);
    } finally {
      setIsLoadingKeys(false);
    }
  }

  async function handleRevoke(keyId: string) {
    setActionLoading(keyId + "_revoke");
    try {
      await revokeKey(keyId);
      toast.success("API key revoked.");
      await loadKeys();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to revoke key.";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(keyId: string) {
    setActionLoading(keyId + "_delete");
    try {
      await deleteKey(keyId);
      toast.success("API key deleted.");
      setKeys((prev) => prev.filter((k) => k.keyId !== keyId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete key.";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Render: free users
  // ---------------------------------------------------------------------------
  if (!isPaid) {
    return (
      <Card className="max-w-lg">
        <div className="flex items-start gap-3">
          <KeyRound className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-1">Agent API</h2>
            <p className="text-sm text-muted-foreground">
              Upgrade to Pro to use the API and automate your resume workflow.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: paid users
  // ---------------------------------------------------------------------------
  const activeKeys = keys.filter((k) => k.isActive);

  return (
    <>
      <Card className="max-w-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Agent API</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Use API keys to access OneSheet programmatically.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowModal(true)}
            disabled={activeKeys.length >= 3}
            className="flex-shrink-0"
          >
            Generate Key
          </Button>
        </div>

        {activeKeys.length >= 3 && (
          <p className="text-xs text-muted-foreground mb-3">
            Maximum of 3 active keys reached. Revoke or delete a key to create a new one.
          </p>
        )}

        {isLoadingKeys ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No API keys yet. Generate one to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Key</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Created</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Last Used</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2">Status</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {keys.map((key) => (
                  <tr key={key.keyId} className={key.isActive ? "" : "opacity-50"}>
                    <td className="py-2.5 pr-4 font-medium text-foreground whitespace-nowrap">
                      {key.name}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="font-mono text-xs text-muted-foreground">
                        {maskPrefix(key.prefix)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(key.createdAt)}
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(key.lastUsedAt)}
                    </td>
                    <td className="py-2.5 pr-4">
                      {key.isActive ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-success/10 text-success">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1">
                        {key.isActive && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(key.keyId)}
                            disabled={actionLoading !== null}
                            className="p-1.5 text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors disabled:opacity-50"
                            aria-label={`Revoke ${key.name}`}
                            title="Revoke"
                          >
                            {actionLoading === key.keyId + "_revoke" ? (
                              <span className="w-3.5 h-3.5 block rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
                            ) : (
                              <X className="w-3.5 h-3.5" strokeWidth={2} />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(key.keyId)}
                          disabled={actionLoading !== null}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
                          aria-label={`Delete ${key.name}`}
                          title="Delete"
                        >
                          {actionLoading === key.keyId + "_delete" ? (
                            <span className="w-3.5 h-3.5 block rounded-full border-2 border-destructive border-t-transparent animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          Send your key in the <code className="font-mono bg-muted px-1 rounded">X-API-Key</code> header.
          Keys are shown only once at creation.
        </p>
      </Card>

      <GenerateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={loadKeys}
      />
    </>
  );
}
