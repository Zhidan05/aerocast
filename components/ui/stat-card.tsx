import { Info, type LucideIcon } from "lucide-react";

export function StatCard({ label, value, helper, icon: Icon, tone = "blue", highlight = false, tooltip }: {
  label: string; value: string | number; helper?: string; icon?: LucideIcon;
  tone?: "blue" | "indigo" | "green" | "amber"; highlight?: boolean; tooltip?: string;
}) {
  return <div className={`card stat-card tone-${tone} ${highlight ? "stat-highlight" : ""}`}>
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-1.5"><span className="stat-label">{label}</span>
        {tooltip && <span className="info-tooltip" tabIndex={0} aria-label={`${label}: ${tooltip}`}><Info size={13} /><span role="tooltip">{tooltip}</span></span>}
      </div>
      {Icon && <span className="icon-tile small"><Icon size={18} aria-hidden="true" /></span>}
    </div>
    <p className="stat-value">{value}</p>
    {helper && <p className="stat-helper">{helper}</p>}
  </div>;
}
