import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

// ---------------------------------------------------------------------------
// OpenRouter API Key
// ---------------------------------------------------------------------------

export async function getOpenRouterKey(): Promise<string | null> {
  const snap = await getDoc(doc(db, "config", "openrouter"));
  return (snap.data()?.apiKey as string) ?? null;
}

export async function setOpenRouterKey(apiKey: string): Promise<void> {
  await setDoc(doc(db, "config", "openrouter"), { apiKey }, { merge: true });
}

// ---------------------------------------------------------------------------
// AI Config (Free + Pro models)
// ---------------------------------------------------------------------------

export interface AIConfig {
  freeModelId: string | null;
  freeModelName: string | null;
  proModelId: string | null;
  proModelName: string | null;
  favoriteModelIds: string[];
}

export async function getAIConfig(): Promise<AIConfig> {
  const snap = await getDoc(doc(db, "config", "ai"));
  const data = snap.data();
  return {
    freeModelId: (data?.freeModelId as string) ?? null,
    freeModelName: (data?.freeModelName as string) ?? null,
    proModelId: (data?.proModelId as string) ?? null,
    proModelName: (data?.proModelName as string) ?? null,
    favoriteModelIds: (data?.favoriteModelIds as string[]) ?? [],
  };
}

// ---------------------------------------------------------------------------
// Admin Tier Override (account-wide, stored in config/admin)
// ---------------------------------------------------------------------------

export async function getAdminTierOverride(): Promise<"free" | "pro"> {
  const snap = await getDoc(doc(db, "config", "admin"));
  return (snap.data()?.tierOverride as "free" | "pro") ?? "pro";
}

export async function setAdminTierOverride(tier: "free" | "pro"): Promise<void> {
  await setDoc(
    doc(db, "config", "admin"),
    { tierOverride: tier },
    { merge: true }
  );
}

export async function setFreeModel(
  modelId: string,
  modelName: string
): Promise<void> {
  await setDoc(
    doc(db, "config", "ai"),
    { freeModelId: modelId, freeModelName: modelName },
    { merge: true }
  );
}

export async function setProModel(
  modelId: string,
  modelName: string
): Promise<void> {
  await setDoc(
    doc(db, "config", "ai"),
    { proModelId: modelId, proModelName: modelName },
    { merge: true }
  );
}

export async function setFavoriteModels(modelIds: string[]): Promise<void> {
  await setDoc(
    doc(db, "config", "ai"),
    { favoriteModelIds: modelIds },
    { merge: true }
  );
}
