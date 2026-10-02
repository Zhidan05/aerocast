"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChartNoAxesCombined, Check, Database, Dices, Download, History, IndianRupee, Info, LoaderCircle, Plane, Plus, Route, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ProbabilityBars } from "@/components/ui/probability-bars";
import { PriceDistribution } from "@/components/charts/price-distribution";
import { SimulationFields, validateSimulationParameters } from "@/components/monte-carlo/simulation-fields";
import { dashboardStats, defaultParameters, predictionMetrics, probabilityBands } from "@/lib/mock-data/dashboard";
import { downloadFile, formatNumber, formatPrice } from "@/lib/format";
import { PriceDisplay } from "@/components/ui/price-display";
import type { SimulationParameters } from "@/lib/types";

const statIcons = { database: Database, plane: Plane, route: Route, price: IndianRupee };

export function DashboardView({ 
  recentRuns = [], 
  datasetSummary, 
  accuracySummary 
}: { 
  recentRuns?: any[]; 
  datasetSummary?: any; 
  accuracySummary?: any; 
}) {
  const [parameters, setParameters] = useState(defaultParameters);
  const [submitted, setSubmitted] = useState(defaultParameters);
  const [status, setStatus] = useState<"example" | "running" | "complete" | "edited">("example");
  const [error, setError] = useState<string | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);

  function updateParameters(value: SimulationParameters) {
    setParameters(value); setError(null); setStatus("edited");
  }
  function runPreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateSimulationParameters(parameters);
    if (validation) { setError(validation); return; }
    setError(null); setStatus("running");
    timeout.current = setTimeout(() => { setSubmitted({ ...parameters }); setStatus("complete"); }, 900);
  }
  function exportOutput() {
    downloadFile("aerocast-demo-output.json", JSON.stringify({ mode: "illustrative-demo", requestedParameters: submitted, note: "Fixed example results; no actual prediction was calculated.", exampleResults: predictionMetrics, probabilityBands }, null, 2), "application/json");
  }
  return <div className="page-stack">
    <PageHeader eyebrow="WORKSPACE OVERVIEW" title="Flight Fare Prediction Dashboard" description="Explore historical airline fares and run Monte Carlo simulations to estimate possible ticket price distributions." actions={<button className="button button-primary" onClick={() => { formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); formRef.current?.querySelector("select")?.focus({ preventScroll: true }); }}><Plus size={15} />Run New Simulation</button>} />
    <div className="stat-grid">
      <StatCard label="Total Records" value={datasetSummary ? formatNumber(datasetSummary.total_records) : "300,153"} helper="Real flight prices" icon={Database} tone="blue" />
      <StatCard label="Airlines & Routes" value={datasetSummary ? `${datasetSummary.airlines} / ${datasetSummary.routes}` : "6 / 12"} helper="Distinct carriers and city pairs" icon={Plane} tone="indigo" />
      <StatCard label="Average MAPE" value={accuracySummary?.average_mape ? `${Number(accuracySummary.average_mape).toFixed(2)}%` : "—"} helper="Mean Absolute Percentage Error" icon={ChartNoAxesCombined} tone="green" />
      <StatCard label="Average Coverage" value={accuracySummary?.average_interval_coverage ? `${Number(accuracySummary.average_interval_coverage).toFixed(2)}%` : "—"} helper="Prices inside 95% interval" icon={History} tone="amber" />
    </div>

    <Card>
      <CardHeader title="Quick Monte Carlo Simulation" description="Set your flight parameters and explore an example prediction distribution." icon={SlidersHorizontal} action={<Badge><Dices size={12} />Monte Carlo preview</Badge>} />
      <form ref={formRef} onSubmit={runPreview} className="px-5 pb-5 sm:px-6 sm:pb-6" noValidate>
        <SimulationFields value={parameters} onChange={updateParameters} disabled={status === "running"} compact />
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{error}</p>}
        <div className="mt-5 flex flex-col justify-between gap-4 rounded-lg bg-slate-50 px-4 py-3 sm:flex-row sm:items-center">
          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-500"><Info size={14} className="mt-0.5 shrink-0 text-blue-500" /><span>Interactive demo · Results use a fixed illustrative dataset.</span></p>
          <button type="submit" className="button button-primary shrink-0" disabled={status === "running"}>{status === "running" ? <LoaderCircle size={16} className="animate-spin" /> : <Dices size={16} />}{status === "running" ? "Preparing demo…" : "Run Monte Carlo Simulation"}</button>
        </div>
      </form>
    </Card>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3"><h2 className="text-sm">Prediction overview</h2><Badge tone={status === "complete" ? "green" : "slate"}>{status === "complete" ? <><Check size={12} />Demo complete</> : "Example result"}</Badge></div>
      <span className="font-mono text-[10px] text-slate-500">Delhi → Mumbai · Economy · 7 days · 10,000 runs</span>
    </div>
    <div aria-live="polite" className={status === "example" ? "sr-only" : "-mt-3 text-xs text-slate-500"}>
      {status === "complete" ? `Preview prepared for ${submitted.source} → ${submitted.destination}, ${submitted.cabinClass}, ${submitted.daysLeft} days, ${formatNumber(submitted.iterations)} requested runs. The example values below remain fixed.` : status === "edited" ? "Parameters changed. Run the preview to review your selection; the example below remains unchanged." : status === "running" ? "Preparing your interactive demo preview…" : "Showing illustrative results."}
    </div>
    <div className="stat-grid">{predictionMetrics.map((metric, index) => <StatCard key={metric.label} {...metric} value={<PriceDisplay amount={metric.value} />} highlight={index === 0} />)}</div>
    <div className="chart-grid">
      <Card><CardHeader title="Monte Carlo Price Distribution" description="A distribution of possible fares across 10,000 example runs." icon={ChartNoAxesCombined} action={<Badge>10,000 runs</Badge>} /><div className="px-3 pb-5 sm:px-6"><PriceDistribution /><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-[10px] text-slate-500"><span>Illustrative distribution · not a guaranteed fare</span><span className="font-mono">INR (₹)</span></div></div></Card>
      <Card><CardHeader title="Probability Summary" description="Likelihood of a fare within each price range." action={<span className="font-mono text-[10px] text-slate-400">Σ 100%</span>} /><div className="px-6 pb-6"><ProbabilityBars items={probabilityBands} /><div className="mt-6 rounded-lg bg-indigo-50/80 p-4"><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-indigo-800"><ChartNoAxesCombined size={16} />Reading the distribution</div><p className="text-[11px] leading-7 text-slate-600">In this example, <strong className="font-semibold text-indigo-700">64.1%</strong> of simulated fares fall below ₹10,000. Wider tails reflect less common price outcomes.</p><Link href="/monte-carlo" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600">Explore the full workflow <ArrowRight size={13} /></Link></div></div></Card>
    </div>
    <Card>
      <CardHeader title="Recent Simulation Runs" description="Saved experiments from the database." icon={History} action={<Link href="/experiments" className="button button-secondary">View all <ArrowRight size={14} /></Link>} />
      <DataTable label="Recent example simulations">
        <thead><tr>{["Experiment","Route & Class","Days Left","Iterations","Expected Price","Median"].map(label => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>
          {recentRuns.length > 0 ? recentRuns.map(run => <tr key={run.id}><td className="font-mono text-xs font-semibold text-slate-600">{run.id.split('-')[0]}</td><td><span className="font-medium">{run.source_city} → {run.destination_city}</span><span className="ml-2 text-xs text-slate-400">{run.class}</span></td><td>{run.days_left} days</td><td className="font-mono text-xs">{formatNumber(run.iteration_count)}</td><td className="font-mono text-xs font-medium text-blue-600"><PriceDisplay amount={run.mean_price} inline /></td><td className="font-mono text-xs"><PriceDisplay amount={run.median_price} inline /></td></tr>) : <tr><td colSpan={6} className="py-6 text-center text-sm text-slate-500">No recent simulations found.</td></tr>}
        </tbody>
      </DataTable>
      <div className="table-footer"><span>Live database data · Real experiments</span></div>
    </Card>
  </div>;
}
