import { ResumeStyles } from '../types/resume';

export type PresetId = 'classic' | 'modern' | 'minimal' | 'technical' | 'compact';

export interface PresetMeta {
  id: PresetId;
  name: string;
  description: string;
}

export const PRESET_LIST: PresetMeta[] = [
  { id: 'classic',   name: 'Classic',   description: 'Traditional serif resume, ATS-friendly' },
  { id: 'modern',    name: 'Modern',    description: 'Clean sans-serif with color accents' },
  { id: 'minimal',   name: 'Minimal',   description: 'Maximum content density, understated' },
  { id: 'technical', name: 'Technical', description: 'Monospace developer style' },
  { id: 'compact',   name: 'Compact',   description: 'Two-column high density layout' },
];

export const PRESET_DEFAULTS: Record<PresetId, ResumeStyles> = {
  classic: {
    preset: 'classic',
    displayFont: 'Crimson Text',
    bodyFont: 'Crimson Text',
    fontSize: 15,
    lineHeight: 1.4,
    accentColor: '#000000',
    headerAlignment: 'center',
    density: 'standard',
    sectionSpacing: 'normal',
    pageMargin: 0.5,
    showHeaderDivider: false,
    showSectionDividers: true,
    bulletStyle: 'disc',
    contactLayout: 'inline',
    skillsDisplay: 'inline',
    dateAlignment: 'inline',
    pageSize: 'us-letter',
  },
  modern: {
    preset: 'modern',
    displayFont: 'Inter',
    bodyFont: 'Inter',
    fontSize: 14,
    lineHeight: 1.4,
    accentColor: '#2563EB',
    headerAlignment: 'left',
    density: 'standard',
    sectionSpacing: 'normal',
    pageMargin: 0.5,
    showHeaderDivider: false,
    showSectionDividers: false,
    bulletStyle: 'none',
    contactLayout: 'inline',
    skillsDisplay: 'inline',
    dateAlignment: 'inline',
    pageSize: 'us-letter',
  },
  minimal: {
    preset: 'minimal',
    displayFont: 'Inter',
    bodyFont: 'Inter',
    fontSize: 13,
    lineHeight: 1.3,
    accentColor: '#6B7280',
    headerAlignment: 'left',
    density: 'compact',
    sectionSpacing: 'tight',
    pageMargin: 0.5,
    showHeaderDivider: false,
    showSectionDividers: true,
    bulletStyle: 'dash',
    contactLayout: 'inline',
    skillsDisplay: 'inline',
    dateAlignment: 'inline',
    pageSize: 'us-letter',
  },
  technical: {
    preset: 'technical',
    displayFont: 'JetBrains Mono',
    bodyFont: 'JetBrains Mono',
    fontSize: 13,
    lineHeight: 1.4,
    accentColor: '#000000',
    headerAlignment: 'left',
    density: 'standard',
    sectionSpacing: 'normal',
    pageMargin: 0.5,
    showHeaderDivider: false,
    showSectionDividers: true,
    bulletStyle: 'arrow',
    contactLayout: 'inline',
    skillsDisplay: 'inline',
    dateAlignment: 'inline',
    pageSize: 'us-letter',
  },
  compact: {
    preset: 'compact',
    displayFont: 'Inter',
    bodyFont: 'Inter',
    fontSize: 13,
    lineHeight: 1.3,
    accentColor: '#000000',
    headerAlignment: 'left',
    density: 'compact',
    sectionSpacing: 'tight',
    pageMargin: 0.5,
    showHeaderDivider: false,
    showSectionDividers: true,
    bulletStyle: 'disc',
    contactLayout: 'inline',
    skillsDisplay: 'inline',
    dateAlignment: 'inline',
    pageSize: 'us-letter',
  },
};

export interface FontOption {
  name: string;
  family: string;
  category: 'serif' | 'sans-serif' | 'monospace';
}

export const FONT_OPTIONS: FontOption[] = [
  { name: 'Crimson Text',    family: "'Crimson Text', Georgia, serif",          category: 'serif' },
  { name: 'Source Serif 4',  family: "'Source Serif 4', Georgia, serif",        category: 'serif' },
  { name: 'Lora',            family: "'Lora', Georgia, serif",                  category: 'serif' },
  { name: 'Playfair Display',family: "'Playfair Display', Georgia, serif",      category: 'serif' },
  { name: 'Inter',           family: "'Inter', system-ui, sans-serif",          category: 'sans-serif' },
  { name: 'Source Sans 3',   family: "'Source Sans 3', system-ui, sans-serif",  category: 'sans-serif' },
  { name: 'Montserrat',      family: "'Montserrat', system-ui, sans-serif",     category: 'sans-serif' },
  { name: 'Raleway',         family: "'Raleway', system-ui, sans-serif",        category: 'sans-serif' },
  { name: 'JetBrains Mono',  family: "'JetBrains Mono', 'Courier New', monospace", category: 'monospace' },
];

export interface AccentColor {
  name: string;
  hex: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  { name: 'Black',      hex: '#000000' },
  { name: 'Slate',      hex: '#475569' },
  { name: 'Charcoal',   hex: '#374151' },
  { name: 'Navy',       hex: '#1e3a5f' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Teal',       hex: '#0d9488' },
  { name: 'Forest',     hex: '#166534' },
  { name: 'Purple',     hex: '#7c3aed' },
  { name: 'Burgundy',   hex: '#7f1d1d' },
];

export function deriveStyles(
  templateId: string,
  paperSize: 'us-letter' | 'a4',
): ResumeStyles {
  const presetId = (templateId as PresetId) in PRESET_DEFAULTS ? (templateId as PresetId) : 'classic';
  return {
    ...PRESET_DEFAULTS[presetId],
    pageSize: paperSize,
  };
}
