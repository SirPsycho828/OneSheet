import * as React from "react";

interface MarkdownInputProps {
  value: string;
  onChange: (value: string) => void;
  onForceSave: () => void;
}

/**
 * Full-height monospace textarea for markdown input.
 *
 * Keyboard shortcuts:
 *   Ctrl/Cmd + S  — force save (prevent browser default)
 *   Tab           — insert 2 spaces at cursor (prevent focus loss)
 *
 * Paste handler strips rich-text formatting: plain text only.
 */
export function MarkdownInput({ value, onChange, onForceSave }: MarkdownInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // -------------------------------------------------------------------------
  // Keyboard handler
  // -------------------------------------------------------------------------
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

    // Ctrl/Cmd + S — force save
    if (ctrlOrCmd && e.key === "s") {
      e.preventDefault();
      onForceSave();
      return;
    }

    // Tab — insert 2 spaces at cursor position
    if (e.key === "Tab") {
      e.preventDefault();
      const el = textareaRef.current;
      if (!el) return;

      const start = el.selectionStart;
      const end = el.selectionEnd;
      const spaces = "  ";

      const next = value.substring(0, start) + spaces + value.substring(end);
      onChange(next);

      // Restore cursor position after the inserted spaces
      requestAnimationFrame(() => {
        el.selectionStart = start + spaces.length;
        el.selectionEnd = start + spaces.length;
      });
    }
  }

  // -------------------------------------------------------------------------
  // Paste handler — plain text only
  // -------------------------------------------------------------------------
  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const el = textareaRef.current;
    if (!el) return;

    const plain = e.clipboardData.getData("text/plain");
    const start = el.selectionStart;
    const end = el.selectionEnd;

    const next = value.substring(0, start) + plain + value.substring(end);
    onChange(next);

    // Place cursor after pasted content
    requestAnimationFrame(() => {
      el.selectionStart = start + plain.length;
      el.selectionEnd = start + plain.length;
    });
  }

  return (
    <div className="h-full w-full overflow-hidden bg-white">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        placeholder="# Your Name&#10;&#10;## Experience&#10;&#10;**Company Name** *Jan 2023 – Present*&#10;- Achievement one&#10;- Achievement two"
        aria-label="Markdown editor"
        className={[
          "w-full h-full resize-none",
          "font-mono text-base text-gray-900 leading-relaxed",
          "bg-white",
          "border-none outline-none",
          "p-6",
          "placeholder:text-gray-400",
        ].join(" ")}
        style={{ padding: "24px" }}
      />
    </div>
  );
}
