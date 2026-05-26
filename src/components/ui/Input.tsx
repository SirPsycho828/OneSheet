import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "h-9 px-3 text-sm rounded-md border bg-card",
            "placeholder:text-muted-foreground",
            "transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:border-transparent",
            error
              ? "border-destructive"
              : "border-input",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-invalid={!!error}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={inputId ? `${inputId}-error` : undefined}
            className="mt-1.5 text-xs text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
