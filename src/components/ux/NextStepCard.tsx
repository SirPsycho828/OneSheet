import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface NextStepCardProps {
  title: string;
  description: string;
  to: string;
  actionLabel?: string;
  icon?: React.ReactNode;
}

export function NextStepCard({
  title,
  description,
  to,
  actionLabel,
  icon,
}: NextStepCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border-l-4 border-l-primary bg-card p-4 shadow-sm">
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Link
        to={to}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-brand-600 transition-colors"
      >
        {actionLabel ?? title}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
