import * as React from "react";
import { AlignLeft, AlignCenter, AlignRight, Check, RotateCcw } from "lucide-react";
import type { ResumeStyles } from "../../types/resume";
import { PRESET_LIST, PRESET_DEFAULTS, FONT_OPTIONS, ACCENT_COLORS } from "../../constants/presets";
import type { PresetId } from "../../constants/presets";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DesignPanelProps {
  styles: ResumeStyles;
  onStylesChange: (styles: ResumeStyles) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Type-safe single-key updater. */
function useStyleUpdater(
  styles: ResumeStyles,
  onStylesChange: (styles: ResumeStyles) => void,
) {
  return React.useCallback(
    function updateStyle<K extends keyof ResumeStyles>(key: K, value: ResumeStyles[K]) {
      onStylesChange({ ...styles, [key]: value });
    },
    [styles, onStylesChange],
  );
}

/** Returns true when the current styles differ from the active preset defaults. */
function hasCustomizations(styles: ResumeStyles): boolean {
  const defaults = PRESET_DEFAULTS[styles.preset];
  return (Object.keys(defaults) as Array<keyof ResumeStyles>).some(
    (key) => styles[key] !== defaults[key],
  );
}

/** Group fonts by category for <optgroup>. */
const FONT_GROUPS = (() => {
  const groups: Record<string, typeof FONT_OPTIONS> = {};
  for (const font of FONT_OPTIONS) {
    const label =
      font.category === "sans-serif"
        ? "Sans-Serif"
        : font.category === "serif"
          ? "Serif"
          : "Monospace";
    (groups[label] ??= []).push(font);
  }
  return groups;
})();

// ---------------------------------------------------------------------------
// Sub-components: Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="group">
      <summary className="flex items-center cursor-pointer select-none text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 list-none [&::-webkit-details-marker]:hidden">
        <span className="mr-1.5 text-[10px] text-gray-400 transition-transform group-open:rotate-90">&#9654;</span>
        {title}
      </summary>
      <div className="space-y-3 pb-1">{children}</div>
    </details>
  );
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm text-gray-700">
      {children}
    </label>
  );
}

function FieldRow({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

const selectClasses =
  "h-8 px-2 text-sm rounded border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent";

// ---------------------------------------------------------------------------
// Font Select (shared for display / body)
// ---------------------------------------------------------------------------

function FontSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${selectClasses} w-44`}
    >
      {Object.entries(FONT_GROUPS).map(([group, fonts]) => (
        <optgroup key={group} label={group}>
          {fonts.map((f) => (
            <option key={f.name} value={f.name} style={{ fontFamily: f.family }}>
              {f.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// DesignPanel
// ---------------------------------------------------------------------------

export function DesignPanel({ styles, onStylesChange }: DesignPanelProps) {
  const updateStyle = useStyleUpdater(styles, onStylesChange);

  // Custom color input state
  const isCustomColor = !ACCENT_COLORS.some((c) => c.hex === styles.accentColor);
  const [showCustomInput, setShowCustomInput] = React.useState(isCustomColor);
  const [customHex, setCustomHex] = React.useState(isCustomColor ? styles.accentColor : "#");

  // Sync custom hex when styles change externally
  React.useEffect(() => {
    const custom = !ACCENT_COLORS.some((c) => c.hex === styles.accentColor);
    if (custom) {
      setShowCustomInput(true);
      setCustomHex(styles.accentColor);
    }
  }, [styles.accentColor]);

  // -----------------------------------------------------------------------
  // Preset change handler
  // -----------------------------------------------------------------------
  function handlePresetChange(presetId: PresetId) {
    if (presetId === styles.preset && !hasCustomizations(styles)) return;

    if (hasCustomizations(styles)) {
      const presetName = PRESET_LIST.find((p) => p.id === presetId)?.name ?? presetId;
      if (!window.confirm(`Reset all style options to ${presetName} defaults?`)) return;
    }

    onStylesChange(PRESET_DEFAULTS[presetId]);
  }

  // -----------------------------------------------------------------------
  // Reset handler
  // -----------------------------------------------------------------------
  function handleReset() {
    if (!hasCustomizations(styles)) return;
    const presetName = PRESET_LIST.find((p) => p.id === styles.preset)?.name ?? styles.preset;
    if (!window.confirm(`Reset all style options to ${presetName} defaults?`)) return;
    onStylesChange(PRESET_DEFAULTS[styles.preset]);
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="h-full overflow-y-auto p-4 space-y-6 bg-white">
      {/* ---------------------------------------------------------------- */}
      {/* Presets                                                           */}
      {/* ---------------------------------------------------------------- */}
      <Section title="Presets">
        <div className="grid grid-cols-3 gap-2">
          {PRESET_LIST.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetChange(preset.id)}
              className={[
                "text-left rounded-lg border p-2.5 transition-shadow",
                styles.preset === preset.id
                  ? "ring-2 ring-brand-500 ring-offset-2 border-brand-300"
                  : "border-gray-200 hover:border-gray-300",
              ].join(" ")}
            >
              <div className="text-sm font-bold text-gray-900 leading-tight">{preset.name}</div>
              <div className="text-xs text-gray-500 leading-snug mt-0.5">{preset.description}</div>
            </button>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Typography                                                        */}
      {/* ---------------------------------------------------------------- */}
      <Section title="Typography">
        <FieldRow label="Display font" htmlFor="dp-display-font">
          <FontSelect id="dp-display-font" value={styles.displayFont} onChange={(v) => updateStyle("displayFont", v)} />
        </FieldRow>

        <FieldRow label="Body font" htmlFor="dp-body-font">
          <FontSelect id="dp-body-font" value={styles.bodyFont} onChange={(v) => updateStyle("bodyFont", v)} />
        </FieldRow>

        <div>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="dp-font-size">Font size</Label>
            <span className="text-xs text-gray-500 tabular-nums">{styles.fontSize}px</span>
          </div>
          <input
            id="dp-font-size"
            type="range"
            min={11}
            max={16}
            step={0.5}
            value={styles.fontSize}
            onChange={(e) => updateStyle("fontSize", parseFloat(e.target.value))}
            className="w-full accent-brand-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="dp-line-height">Line height</Label>
            <span className="text-xs text-gray-500 tabular-nums">{styles.lineHeight.toFixed(1)}</span>
          </div>
          <input
            id="dp-line-height"
            type="range"
            min={1.2}
            max={1.8}
            step={0.1}
            value={styles.lineHeight}
            onChange={(e) => updateStyle("lineHeight", parseFloat(e.target.value))}
            className="w-full accent-brand-500"
          />
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Color                                                             */}
      {/* ---------------------------------------------------------------- */}
      <Section title="Color">
        <div>
          <Label>Accent color</Label>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {ACCENT_COLORS.map((color) => {
              const selected = styles.accentColor === color.hex;
              return (
                <button
                  key={color.hex}
                  type="button"
                  title={color.name}
                  aria-label={color.name}
                  onClick={() => {
                    updateStyle("accentColor", color.hex);
                    setShowCustomInput(false);
                  }}
                  className={[
                    "w-6 h-6 rounded-full flex items-center justify-center transition-shadow",
                    selected ? "ring-2 ring-brand-500 ring-offset-2" : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-1",
                  ].join(" ")}
                  style={{ backgroundColor: color.hex }}
                >
                  {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </button>
              );
            })}
            {/* Custom color circle */}
            <button
              type="button"
              title="Custom color"
              aria-label="Custom color"
              onClick={() => {
                setShowCustomInput(true);
                if (!isCustomColor) setCustomHex("#");
              }}
              className={[
                "w-6 h-6 rounded-full flex items-center justify-center transition-shadow",
                "border-2",
                isCustomColor
                  ? "ring-2 ring-brand-500 ring-offset-2"
                  : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-1",
              ].join(" ")}
              style={{
                borderImage: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red) 1",
                borderImageSlice: 1,
                background: isCustomColor ? styles.accentColor : "white",
                borderRadius: "9999px",
                border: "2px solid transparent",
                backgroundImage: isCustomColor
                  ? `linear-gradient(${styles.accentColor}, ${styles.accentColor}), conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`
                  : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
                backgroundOrigin: "border-box",
                backgroundClip: isCustomColor ? "padding-box, border-box" : "border-box",
              }}
            >
              {isCustomColor && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </button>
          </div>

          {/* Custom hex input */}
          {showCustomInput && (
            <div className="mt-2">
              <input
                type="text"
                maxLength={7}
                pattern="#[0-9a-fA-F]{6}"
                placeholder="#000000"
                value={customHex}
                onChange={(e) => {
                  let v = e.target.value;
                  // Auto-prepend # if missing
                  if (v && !v.startsWith("#")) v = "#" + v;
                  setCustomHex(v);
                  // Apply live when valid 7-char hex
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                    updateStyle("accentColor", v);
                  }
                }}
                className="h-8 w-28 px-2 text-sm rounded border border-gray-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Layout                                                            */}
      {/* ---------------------------------------------------------------- */}
      <Section title="Layout">
        <div>
          <Label>Header alignment</Label>
          <div className="flex gap-1 mt-1.5">
            {([
              { value: "left" as const, icon: AlignLeft, label: "Left" },
              { value: "center" as const, icon: AlignCenter, label: "Center" },
              { value: "right" as const, icon: AlignRight, label: "Right" },
            ]).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                aria-label={label}
                onClick={() => updateStyle("headerAlignment", value)}
                className={[
                  "flex items-center justify-center w-9 h-8 rounded transition-colors",
                  styles.headerAlignment === value
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-500 hover:bg-gray-100",
                ].join(" ")}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
              </button>
            ))}
          </div>
        </div>

        <FieldRow label="Density" htmlFor="dp-density">
          <select
            id="dp-density"
            value={styles.density}
            onChange={(e) => updateStyle("density", e.target.value as ResumeStyles["density"])}
            className={selectClasses}
          >
            <option value="compact">Compact</option>
            <option value="standard">Standard</option>
            <option value="relaxed">Relaxed</option>
          </select>
        </FieldRow>

        <FieldRow label="Section spacing" htmlFor="dp-section-spacing">
          <select
            id="dp-section-spacing"
            value={styles.sectionSpacing}
            onChange={(e) => updateStyle("sectionSpacing", e.target.value as ResumeStyles["sectionSpacing"])}
            className={selectClasses}
          >
            <option value="tight">Tight</option>
            <option value="normal">Normal</option>
            <option value="relaxed">Relaxed</option>
          </select>
        </FieldRow>

        <FieldRow label="Page margin" htmlFor="dp-page-margin">
          <select
            id="dp-page-margin"
            value={styles.pageMargin}
            onChange={(e) => updateStyle("pageMargin", parseFloat(e.target.value))}
            className={selectClasses}
          >
            <option value={0.5}>0.5&quot;</option>
            <option value={0.65}>0.65&quot;</option>
            <option value={0.75}>0.75&quot;</option>
            <option value={1.0}>1.0&quot;</option>
          </select>
        </FieldRow>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Elements                                                          */}
      {/* ---------------------------------------------------------------- */}
      <Section title="Elements">
        <FieldRow label="Header divider">
          <button
            type="button"
            role="switch"
            aria-checked={styles.showHeaderDivider}
            onClick={() => updateStyle("showHeaderDivider", !styles.showHeaderDivider)}
            className={[
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
              styles.showHeaderDivider ? "bg-brand-500" : "bg-gray-300",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
                styles.showHeaderDivider ? "translate-x-[18px]" : "translate-x-[3px]",
              ].join(" ")}
            />
          </button>
        </FieldRow>

        <FieldRow label="Section dividers">
          <button
            type="button"
            role="switch"
            aria-checked={styles.showSectionDividers}
            onClick={() => updateStyle("showSectionDividers", !styles.showSectionDividers)}
            className={[
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
              styles.showSectionDividers ? "bg-brand-500" : "bg-gray-300",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
                styles.showSectionDividers ? "translate-x-[18px]" : "translate-x-[3px]",
              ].join(" ")}
            />
          </button>
        </FieldRow>

        <FieldRow label="Bullet style" htmlFor="dp-bullet-style">
          <select
            id="dp-bullet-style"
            value={styles.bulletStyle}
            onChange={(e) => updateStyle("bulletStyle", e.target.value as ResumeStyles["bulletStyle"])}
            className={selectClasses}
          >
            <option value="disc">&#8226; Disc</option>
            <option value="dash">&ndash; Dash</option>
            <option value="arrow">&#9656; Arrow</option>
            <option value="square">&#9642; Square</option>
            <option value="none">None</option>
          </select>
        </FieldRow>

        <FieldRow label="Contact layout" htmlFor="dp-contact-layout">
          <select
            id="dp-contact-layout"
            value={styles.contactLayout}
            onChange={(e) => updateStyle("contactLayout", e.target.value as ResumeStyles["contactLayout"])}
            className={selectClasses}
          >
            <option value="inline">Inline</option>
            <option value="stacked">Stacked</option>
            <option value="icons">Icons</option>
          </select>
        </FieldRow>

        <FieldRow label="Skills display" htmlFor="dp-skills-display">
          <select
            id="dp-skills-display"
            value={styles.skillsDisplay}
            onChange={(e) => updateStyle("skillsDisplay", e.target.value as ResumeStyles["skillsDisplay"])}
            className={selectClasses}
          >
            <option value="inline">Inline</option>
            <option value="tags">Tags</option>
            <option value="columns">Columns</option>
          </select>
        </FieldRow>

        <FieldRow label="Date alignment" htmlFor="dp-date-alignment">
          <select
            id="dp-date-alignment"
            value={styles.dateAlignment}
            onChange={(e) => updateStyle("dateAlignment", e.target.value as ResumeStyles["dateAlignment"])}
            className={selectClasses}
          >
            <option value="inline">Inline</option>
            <option value="right">Right-aligned</option>
          </select>
        </FieldRow>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Page                                                              */}
      {/* ---------------------------------------------------------------- */}
      <Section title="Page">
        <FieldRow label="Page size" htmlFor="dp-page-size">
          <select
            id="dp-page-size"
            value={styles.pageSize}
            onChange={(e) => updateStyle("pageSize", e.target.value as ResumeStyles["pageSize"])}
            className={selectClasses}
          >
            <option value="us-letter">US Letter</option>
            <option value="a4">A4</option>
          </select>
        </FieldRow>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Reset                                                             */}
      {/* ---------------------------------------------------------------- */}
      <div className="pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={handleReset}
          disabled={!hasCustomizations(styles)}
          className={[
            "inline-flex items-center gap-1.5 text-sm font-medium rounded-md px-3 h-8 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
            hasCustomizations(styles)
              ? "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
              : "text-gray-400 cursor-not-allowed",
          ].join(" ")}
        >
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
          Reset to preset defaults
        </button>
      </div>
    </div>
  );
}
