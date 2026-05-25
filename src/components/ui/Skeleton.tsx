import * as React from "react";

type SkeletonVariant = "rect" | "text" | "circle";

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = "rect",
  width,
  height,
  className = "",
}: SkeletonProps) {
  const variantClasses: Record<SkeletonVariant, string> = {
    rect: "rounded",
    text: "h-4 rounded",
    circle: "rounded-full",
  };

  const style: React.CSSProperties = {};
  if (width !== undefined) {
    style.width = typeof width === "number" ? `${width}px` : width;
  }
  if (height !== undefined) {
    style.height = typeof height === "number" ? `${height}px` : height;
  }

  return (
    <div
      className={[
        "bg-gray-200 animate-pulse",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      aria-hidden="true"
    />
  );
}
