import type { ReactNode } from "react";

export function PageHeader({ eyebrow = "AEROCAST ANALYTICS", title, description, actions }: {
  eyebrow?: string; title: string; description?: string; actions?: ReactNode;
}) {
  return <header className="page-header">
    <div className="min-w-0"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>
    {actions && <div className="page-actions">{actions}</div>}
  </header>;
}
