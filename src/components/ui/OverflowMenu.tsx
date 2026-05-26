import * as React from "react";
import { createPortal } from "react-dom";
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
  triggerLabel?: string;
  placement?: "bottom-right" | "top-right";
}

export function OverflowMenu({
  items,
  triggerLabel = "More options",
  placement = "bottom-right",
}: OverflowMenuProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    if (placement === "top-right") {
      setPos({ top: rect.top, left: rect.right });
    } else {
      setPos({ top: rect.bottom + 4, left: rect.right });
    }
  }, [placement]);

  React.useEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  const dropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          role="menu"
          className="fixed z-50 bg-card rounded-md shadow-lg border border-border py-1 min-w-[140px]"
          style={{
            top: pos.top,
            left: pos.left,
            transform:
              placement === "top-right"
                ? "translate(-100%, -100%) translateY(-4px)"
                : "translateX(-100%)",
          }}
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
                "focus-visible:outline-none focus-visible:bg-muted",
                item.variant === "danger"
                  ? "text-destructive hover:bg-destructive/5"
                  : "text-foreground hover:bg-muted",
                item.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={triggerLabel}
        aria-haspopup="true"
        aria-expanded={open}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreHorizontal className="w-5 h-5" strokeWidth={1.5} />
      </button>
      {dropdown}
    </div>
  );
}
