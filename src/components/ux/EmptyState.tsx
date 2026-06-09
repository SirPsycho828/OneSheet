import { Link } from "react-router-dom";
import { Button } from "../ui/Button";

interface EmptyStateAction {
  label: string;
  to?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
}

function ActionButton({
  action,
  variant = "primary",
}: {
  action: EmptyStateAction;
  variant?: "primary" | "secondary";
}) {
  if (action.to) {
    return (
      <Link to={action.to}>
        <Button variant={variant}>{action.label}</Button>
      </Link>
    );
  }
  return (
    <Button variant={variant} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <h2 className="font-heading text-lg font-medium text-foreground">
        {title}
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && <ActionButton action={action} />}
          {secondaryAction && (
            <ActionButton action={secondaryAction} variant="secondary" />
          )}
        </div>
      )}
    </div>
  );
}
