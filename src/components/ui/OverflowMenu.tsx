import * as React from "react";
import { MoreHorizontal } from "lucide-react";

type MenuItemVariant = "default" | "danger";

interface MenuItem {
  label: string;
  onClick: () => void;
  variant?: MenuItemVariant;
  disabled?: boolean;
}

interface OverflowMenuProps {
  items: MenuItem[];
  /** Optional aria-label for the trigger button */
  triggerLabel?: string;
}

export function OverflowMenu({
  items,
  triggerLabel = "More options",
}: OverflowMenuProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={triggerLabel}
        aria-haspopup="true"
        aria-expanded={open}
        className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <MoreHorizontal className="w-5 h-5" strokeWidth={1.5} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 z-20 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[140px]"
        >
          {items.map((item, index) => (
            <button
              key={index}
              role="menuitem"
              type="button"
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  setOpen(false);
                }
              }}
              className={[
                "w-full text-left px-3 py-2 text-sm transition-colors",
                "focus-visible:outline-none focus-visible:bg-gray-50",
                item.variant === "danger"
                  ? "text-error hover:bg-red-50"
                  : "text-gray-700 hover:bg-gray-50",
                item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
