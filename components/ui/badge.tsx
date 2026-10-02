import type { ReactNode } from "react";

export function Badge({ children, tone = "blue", className = "" }: {
  children: ReactNode; tone?: "blue" | "green" | "amber" | "slate"; className?: string;
}) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>;
}
