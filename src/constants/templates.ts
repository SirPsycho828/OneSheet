export interface TemplateMeta {
  id: string;
  name: string;
  font: string;
  description: string;
}

export const TEMPLATES: TemplateMeta[] = [
  { id: "classic", name: "Classic", font: "Crimson Text", description: "Traditional serif resume" },
  { id: "modern", name: "Modern", font: "Inter", description: "Clean sans-serif with blue accents" },
  { id: "minimal", name: "Minimal", font: "Inter", description: "Maximum content density" },
  { id: "technical", name: "Technical", font: "JetBrains Mono", description: "Monospace developer style" },
  { id: "compact", name: "Compact", font: "Inter", description: "Two-column high density" },
];

export const DEFAULT_TEMPLATE = "classic";
