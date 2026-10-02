import type { ReactNode } from "react";

export function DataTable({ children, label = "Data table" }: { children: ReactNode; label?: string }) {
  return <div className="table-scroll" role="region" aria-label={label} tabIndex={0}>
    <table className="data-table" aria-label={label}>{children}</table>
  </div>;
}
