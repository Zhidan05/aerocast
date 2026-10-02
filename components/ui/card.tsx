import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function Card({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`card ${className}`} {...props}>{children}</div>;
}

export function CardHeader({ title, description, action, icon: Icon }: {
  title: string; description?: string; action?: ReactNode; icon?: LucideIcon;
}) {
  return <div className="card-header">
    <div className="flex min-w-0 items-start gap-3">
      {Icon && <span className="icon-tile"><Icon size={19} aria-hidden="true" /></span>}
      <div className="min-w-0"><h2>{title}</h2>{description && <p>{description}</p>}</div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>;
}
