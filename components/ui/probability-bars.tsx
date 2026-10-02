import type { ProbabilityBand } from "@/lib/types";

export function ProbabilityBars({ items }: { items: ProbabilityBand[] }) {
  return <div className="space-y-5">{items.map(item => <div key={item.label}>
    <div className="mb-2 flex items-center justify-between gap-3 text-xs"><span>{item.label}</span><strong className="font-mono" style={{ color: item.color }}>{item.probability}%</strong></div>
    <div className="h-2 overflow-hidden rounded-full bg-indigo-50" role="meter" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.probability}>
      <div className="h-full rounded-full" style={{ width: `${item.probability}%`, background: item.color }} />
    </div>
  </div>)}</div>;
}
