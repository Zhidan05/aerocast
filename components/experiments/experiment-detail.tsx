"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, Copy, Database, FileChartColumn, Play, X, LoaderCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { downloadFile, formatNumber, formatPrice } from "@/lib/format";
import { PriceDisplay } from "@/components/ui/price-display";

const fourDigits = (value: number) => String(value).padStart(4, "0");

export function ExperimentDetail({ experiment: initialExperiment, onClose, onDuplicate }: { experiment: any; onClose: () => void; onDuplicate: () => void }) {
  const [experiment, setExperiment] = useState(initialExperiment);
  const [loading, setLoading] = useState(!initialExperiment.simulation_buckets);

  useEffect(() => {
    if (!initialExperiment.simulation_buckets) {
      fetch(`/api/experiments/${initialExperiment.id}`)
        .then(res => res.json())
        .then(data => {
          setExperiment(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [initialExperiment.id, initialExperiment.simulation_buckets]);

  if (loading) {
    return <section aria-label={`${initialExperiment.id} details`} className="flex justify-center p-12"><LoaderCircle className="animate-spin text-blue-500" /></section>;
  }

  const buckets = experiment.simulation_buckets || [];
  const samples = experiment.simulation_samples || [];
  const accTest = experiment.accuracy_tests && experiment.accuracy_tests[0];

  const histogram = buckets.map((bucket: any) => ({ 
    label: `₹${(bucket.price_min / 1000).toFixed(1)}k–${(bucket.price_max / 1000).toFixed(1)}k`, 
    frequency: bucket.simulated_frequency || Math.round(bucket.probability * experiment.iteration_count) 
  }));

  const runAgainQuery = new URLSearchParams({ 
    source: experiment.source_city, 
    destination: experiment.destination_city, 
    class: experiment.class, 
    daysLeft: String(experiment.days_left), 
    tolerance: String(experiment.days_tolerance), 
    iterations: String(experiment.iteration_count) 
  });
  if (experiment.seed) runAgainQuery.set('seed', String(experiment.seed));

  function exportResult() {
    downloadFile(`aerocast-${experiment.id.toLowerCase()}.json`, JSON.stringify({ dataMode: "real", experiment }, null, 2), "application/json");
  }

  return <section aria-label={`${experiment.id} details`} className="space-y-5">
    <Card className="overflow-hidden">
      <CardHeader title={`${experiment.id.split('-')[0]} · Experiment detail`} description="A transparent view of the inputs, probability model, and illustrative results." icon={FileChartColumn} action={<button className="button button-ghost" aria-label="Close experiment detail" onClick={onClose}><X size={18} /></button>} />
      <div className="flex flex-col justify-between gap-6 border-y border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50/40 px-6 py-6 sm:flex-row sm:items-center">
        <div><span className="text-xs font-semibold tracking-wider text-blue-700 uppercase">Estimated ticket price</span><p className="my-2 font-mono text-4xl font-semibold tracking-tight text-blue-700"><PriceDisplay amount={experiment.mean_price} showInfo /></p><p className="text-sm text-slate-600">{experiment.source_city} → {experiment.destination_city} · {experiment.class}</p></div>
        <div className="space-y-2 text-sm text-slate-600"><Badge tone="blue">Real result</Badge><p>{formatNumber(experiment.iteration_count)} Monte Carlo iterations</p><p>{experiment.days_left} days before departure · tolerance ±{experiment.days_tolerance} day</p></div>
      </div>
      <div className="flex flex-wrap gap-2 p-5 sm:px-6"><Link href={`/monte-carlo?${runAgainQuery.toString()}`} className="button button-primary"><Play size={15} />Run Again</Link><button onClick={onDuplicate} className="button button-secondary"><Copy size={15} />Duplicate Experiment</button><button onClick={exportResult} className="button button-secondary"><ArrowDownToLine size={15} />Export Result</button></div>
    </Card>

    <div className="stat-grid">
      <StatCard label="Median price" value={<PriceDisplay amount={experiment.median_price} />} tooltip="The middle simulated price: half of outcomes fall below this value." />
      <StatCard label="25th percentile" value={<PriceDisplay amount={experiment.p25} />} tooltip="25% of simulated outcomes fall at or below this price." />
      <StatCard label="75th percentile" value={<PriceDisplay amount={experiment.p75} />} tooltip="75% of simulated outcomes fall at or below this price." />
      <StatCard label="Standard deviation" value={<PriceDisplay amount={experiment.std_deviation} />} tooltip="How widely simulated prices are dispersed around their mean." tone="indigo" />
    </div>

    <div className="grid gap-5 xl:grid-cols-[1fr_1.6fr]">
      <Card><CardHeader title="Historical subset" description="Matched observations" icon={Database} /><dl className="space-y-4 px-6 pb-6 text-sm">{[
        ["Matched records", formatNumber(experiment.historical_sample_count)],
        ["Days left", `${experiment.days_left - experiment.days_tolerance}–${experiment.days_left + experiment.days_tolerance} days`],
        ["Historical minimum", <PriceDisplay amount={experiment.minimum_price} key="min" inline />],
        ["Historical maximum", <PriceDisplay amount={experiment.maximum_price} key="max" inline />],
      ].map(([label, value]) => <div key={label as string} className="flex justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><dt className="text-slate-500">{label}</dt><dd className="font-mono text-xs font-semibold text-slate-800">{value}</dd></div>)}</dl></Card>
      <Card><CardHeader title="Simulation price distribution" description="Actual bucket frequencies from the Monte Carlo simulation." /><div className="chart-frame px-4 pb-5" role="img" aria-label="Histogram of demo ticket price ranges in INR and simulated frequency."><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={histogram} margin={{ top: 5, right: 10, bottom: 30, left: 0 }}><CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" /><XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} label={{ value: "Ticket price range (INR)", position: "bottom", offset: 14, fill: "#64748b", fontSize: 11 }} /><YAxis width={48} tickFormatter={(value: number) => formatNumber(value)} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [formatNumber(Number(value)), "Simulation frequency"]} /><Bar dataKey="frequency" fill="#4f6eec" radius={[4, 4, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer></div></Card>
    </div>

    <Card className="overflow-hidden"><CardHeader title="Probability distribution" description={`Probability = bucket frequency ÷ ${experiment.historical_sample_count} matched historical records.`} /><DataTable label={`${experiment.id} probability distribution`}><thead><tr><th>Price range</th><th>Historical Freq.</th><th>Probability</th><th>Cumulative prob.</th><th>Random interval</th></tr></thead><tbody>{buckets.map((bucket: any) => <tr key={bucket.id}><td className="font-medium"><span className="flex items-center gap-1"><PriceDisplay amount={bucket.price_min} inline /> – <PriceDisplay amount={bucket.price_max} inline /></span></td><td>{bucket.frequency}</td><td className="font-mono text-xs">{Number(bucket.probability).toFixed(4)}</td><td className="font-mono text-xs">{Number(bucket.cumulative_probability).toFixed(4)}</td><td className="font-mono text-xs text-blue-600">{fourDigits(bucket.random_min)}–{fourDigits(bucket.random_max)}</td></tr>)}</tbody></DataTable></Card>

    <Card className="overflow-hidden"><CardHeader title="Random number sample" description={`Sample maps from 0000–9999 range; using the bucket midpoint. Showing ${samples.length} items.`} /><DataTable label={`${experiment.id} random number samples`}><thead><tr><th>Iteration</th><th>Random number</th><th>Price range</th><th>Sampled price</th></tr></thead><tbody>{samples.map((sample: any) => <tr key={sample.id}><td>{sample.iteration}</td><td className="font-mono text-xs text-indigo-600">{fourDigits(sample.random_number)}</td><td><span className="flex items-center gap-1"><PriceDisplay amount={sample.price_range_min} inline /> – <PriceDisplay amount={sample.price_range_max} inline /></span></td><td className="font-mono text-xs font-semibold"><PriceDisplay amount={sample.sampled_price} inline /></td></tr>)}</tbody></DataTable></Card>

    <Card>
      <CardHeader title="Accuracy Evaluation" description="Evaluation against held-out historical data." />
      <div className="px-6 pb-6">
        {accTest ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div><dt className="text-xs text-slate-500 mb-1">MAPE</dt><dd className="font-mono text-sm font-semibold text-blue-700">{Number(accTest.mape).toFixed(2)}%</dd></div>
              <div><dt className="text-xs text-slate-500 mb-1">MAE</dt><dd className="font-mono text-sm font-semibold text-slate-800"><PriceDisplay amount={accTest.mae} /></dd></div>
              <div><dt className="text-xs text-slate-500 mb-1">RMSE</dt><dd className="font-mono text-sm font-semibold text-slate-800"><PriceDisplay amount={accTest.rmse} /></dd></div>
              <div><dt className="text-xs text-slate-500 mb-1">95% Coverage</dt><dd className="font-mono text-sm font-semibold text-slate-800">{accTest.interval_coverage ? `${Number(accTest.interval_coverage).toFixed(2)}%` : '-'}</dd></div>
              <div><dt className="text-xs text-slate-500 mb-1">Bias</dt><dd className="font-mono text-sm font-semibold text-slate-800">{accTest.bias ? <PriceDisplay amount={accTest.bias} /> : '-'}</dd></div>
              <div><dt className="text-xs text-slate-500 mb-1">95% Interval</dt><dd className="font-mono text-sm font-semibold text-slate-800">{accTest.interval_95_low ? <span className="flex items-center gap-1"><PriceDisplay amount={accTest.interval_95_low} inline /> – <PriceDisplay amount={accTest.interval_95_high} inline /></span> : '-'}</dd></div>
              <div><dt className="text-xs text-slate-500 mb-1">Evaluation Samples</dt><dd className="font-mono text-sm font-semibold text-slate-800">{formatNumber(accTest.test_samples)}</dd></div>
              <div><dt className="text-xs text-slate-500 mb-1">Created At</dt><dd className="text-sm font-semibold text-slate-800">{new Date(accTest.created_at).toLocaleDateString()}</dd></div>
            </dl>
            <div className="flex items-center gap-3">
              <Link href={`/accuracy/${accTest.id}`} className="button button-primary">View Full Evaluation</Link>
              <Link href={`/accuracy?simulationId=${experiment.id}`} className="button button-secondary">Run New Evaluation</Link>
              {experiment.accuracy_tests && experiment.accuracy_tests.length > 1 && <span className="text-xs text-slate-500 ml-auto">{experiment.accuracy_tests.length} saved evaluations</span>}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            <p className="text-sm text-slate-500 mb-4">Not evaluated yet</p>
            <Link href={`/accuracy?simulationId=${experiment.id}`} className="button button-primary">Evaluate Accuracy</Link>
          </div>
        )}
      </div>
    </Card>
  </section>;
}
