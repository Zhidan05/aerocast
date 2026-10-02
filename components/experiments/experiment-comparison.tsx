"use client";

import { GitCompareArrows, Info, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { formatNumber, formatPrice } from "@/lib/format";
import { PriceDisplay } from "@/components/ui/price-display";
import { useCurrency } from "@/components/currency-provider";

export function ExperimentComparison({ experiments, onClose }: { experiments: any[]; onClose: () => void }) {
  const { rate, formatIDR } = useCurrency();
  const first = experiments[0];
  const sameParameters = first && experiments.every((experiment) => experiment.source_city === first.source_city && experiment.destination_city === first.destination_city && experiment.class === first.class && experiment.days_left === first.days_left && experiment.days_tolerance === first.days_tolerance);
  const convergence = sameParameters && new Set(experiments.map((experiment) => experiment.iteration_count)).size === experiments.length;
  const chartData = [...experiments].sort((a, b) => a.iteration_count - b.iteration_count).map((experiment) => ({ label: convergence ? formatNumber(experiment.iteration_count) : experiment.id.split('-')[0], price: experiment.mean_price }));

  const formatTooltipValue = (value: number, name: string) => {
    if (!rate) return [formatPrice(value), name];
    return [`${formatPrice(value)} (≈ ${formatIDR(value)})`, name];
  };

  return <Card className="overflow-hidden">
    <CardHeader title="Experiment comparison" description="Inspect expected prices, dispersion, and evaluation metrics side by side." icon={GitCompareArrows} action={<button className="button button-ghost" aria-label="Close experiment comparison" onClick={onClose}><X size={18} /></button>} />
    {experiments.length < 2 ? <div className="px-6 pb-8 text-sm text-slate-500">Select at least two experiments in the table above to compare their results.</div> : <>
      <DataTable label="Experiment result comparison">
        <thead><tr><th>Experiment / route</th><th>Iterations</th><th>Mean</th><th>Median</th><th><abbr title="Standard deviation: dispersion of simulated prices">Std. dev.</abbr></th><th><abbr title="Mean absolute percentage error">MAPE</abbr></th></tr></thead>
        <tbody>{experiments.map((experiment) => {
          const accTest = experiment.accuracy_tests && experiment.accuracy_tests[0];
          return <tr key={experiment.id}><td><span className="font-mono text-xs font-semibold text-blue-600">{experiment.id.split('-')[0]}</span><div className="mt-1 font-medium">{experiment.source_city} → {experiment.destination_city}</div><div className="mt-1 text-xs text-slate-500">{experiment.class} · {experiment.days_left} days ± {experiment.days_tolerance}</div></td><td className="font-mono text-xs">{formatNumber(experiment.iteration_count)}</td><td className="font-mono text-xs font-semibold"><PriceDisplay amount={experiment.mean_price} /></td><td className="font-mono text-xs"><PriceDisplay amount={experiment.median_price} /></td><td className="font-mono text-xs"><PriceDisplay amount={experiment.std_deviation} /></td><td className="font-mono text-xs">{accTest ? `${Number(accTest.mape).toFixed(1)}%` : '-'}</td></tr>
        })}</tbody>
      </DataTable>
      <div className="p-5 sm:p-6">
        <h3 className="mb-1 text-sm font-semibold">{convergence ? "Estimated mean by iteration count" : "Expected price by experiment"}</h3>
        <p className="mb-5 text-xs leading-relaxed text-slate-500">{convergence ? `${first.source_city} → ${first.destination_city} · ${first.class} · ${first.days_left} days before departure. Equal horizontal spacing represents each selected iteration count.` : "Different route parameters or repeated iteration counts are shown as separate experiments."}</p>
        <div className="chart-frame" role="img" aria-label={convergence ? "Line chart of estimated mean price in INR against the selected iteration counts; exact values in the table above." : "Bar chart of expected price in INR for each selected experiment; exact values in the table above."}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            {convergence ? <LineChart data={chartData} margin={{ top: 12, right: 15, bottom: 28, left: 10 }}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "Number of iterations", position: "bottom", offset: 10, fill: "#64748b", fontSize: 11 }} /><YAxis width={62} domain={["dataMin - 200", "dataMax + 200"]} tickFormatter={(value: number) => `₹${(value / 1000).toFixed(1)}k`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value: any) => formatTooltipValue(Number(value), "Estimated mean")} labelFormatter={(label) => `${label} iterations`} /><Line type="linear" dataKey="price" stroke="#2563eb" strokeWidth={3} dot={{ r: 5, fill: "#fff", strokeWidth: 3 }} activeDot={{ r: 7 }} isAnimationActive={false} /></LineChart> : <BarChart data={chartData} margin={{ top: 12, right: 15, bottom: 28, left: 10 }}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "Experiment", position: "bottom", offset: 10, fill: "#64748b", fontSize: 11 }} /><YAxis width={62} tickFormatter={(value: number) => `₹${value / 1000}k`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value: any) => formatTooltipValue(Number(value), "Expected price")} /><Bar dataKey="price" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={100} isAnimationActive={false} /></BarChart>}
          </ResponsiveContainer>
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-indigo-50 px-4 py-3 text-xs leading-relaxed text-indigo-700"><Info size={15} className="mt-0.5 shrink-0" />{convergence ? "More iterations can stabilize an estimate, but do not remove bias in historical data. This chart illustrates convergence using real results." : "Compare the same route, class, days left, and tolerance at different iteration counts to explore convergence. All displayed results are real data."}</p>
      </div>
    </>}
  </Card>;
}
