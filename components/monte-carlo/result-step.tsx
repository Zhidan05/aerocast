import { useState } from "react";
import Link from "next/link";
import { ChartColumn, Info, Save, LoaderCircle, CheckCircle2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatPrice } from "@/lib/format";
import { PriceDisplay } from "@/components/ui/price-display";
import type { MonteCarloResult } from "@/lib/monte-carlo";
import { SimulatedPriceDistribution } from "./workflow-charts";

export function ResultStep({ result }: { result: MonteCarloResult }) {
  const { parameters, statistics, probabilityInsights } = result;
  
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSave() {
    if (saveState === 'saving' || saveState === 'saved') return;
    
    setSaveState('saving');
    setErrorMessage(null);

    try {
      const res = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });

      const data = await res.json();
      
      if (res.ok && data.id) {
        setSavedId(data.id);
        setSaveState('saved');
      } else {
        setErrorMessage(data.error || "Failed to save experiment.");
        setSaveState('error');
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error.");
      setSaveState('error');
    }
  }
  
  const resultMetrics = [
    { label: "Expected Price (Mean)", value: <PriceDisplay amount={statistics.mean} /> },
    { label: "Median Price (P50)", value: <PriceDisplay amount={statistics.median} /> },
    { label: "Minimum Price", value: <PriceDisplay amount={statistics.min} /> },
    { label: "Maximum Price", value: <PriceDisplay amount={statistics.max} /> },
    { label: "Standard Deviation", value: <PriceDisplay amount={statistics.stdDev} /> },
    { label: "25th Percentile", value: <PriceDisplay amount={statistics.percentiles.p25} /> },
    { label: "75th Percentile", value: <PriceDisplay amount={statistics.percentiles.p75} /> },
    { label: "95% Simulation Interval", value: <span className="flex items-center gap-1"><PriceDisplay amount={statistics.percentiles.p2_5} inline /> - <PriceDisplay amount={statistics.percentiles.p97_5} inline /></span> },
  ];

  const insightsArray = [
    { label: probabilityInsights.belowP25.label, probability: (probabilityInsights.belowP25.percentage * 100).toFixed(2), note: "Highly favorable scenario." },
    { label: probabilityInsights.p25ToP50.label, probability: (probabilityInsights.p25ToP50.percentage * 100).toFixed(2), note: "Below median." },
    { label: probabilityInsights.p50ToP75.label, probability: (probabilityInsights.p50ToP75.percentage * 100).toFixed(2), note: "Above median." },
    { label: probabilityInsights.aboveP75.label, probability: (probabilityInsights.aboveP75.percentage * 100).toFixed(2), note: "Unfavorable scenario." },
  ];

  return <div className="page-stack">
    <section className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 sm:p-8" aria-label="Prediction result">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div><Badge tone="blue">Prediction result</Badge><h2 className="mt-4 text-sm font-medium text-slate-600">Estimated Ticket Price</h2><p className="mt-2 font-mono text-4xl font-semibold tracking-tight text-blue-600 sm:text-5xl"><PriceDisplay amount={statistics.mean} showInfo /></p><p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">Based on {formatNumber(parameters.iterations)} Monte Carlo simulations using {formatNumber(result.historicalSampleCount)} historical observations for <strong className="font-semibold text-slate-800">{parameters.sourceCity} → {parameters.destinationCity}</strong>, {parameters.flightClass}, {parameters.daysLeft} days before departure.</p></div>
        
        <div className="flex flex-col items-end gap-2">
          {saveState === 'saved' && savedId ? (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                <CheckCircle2 size={16} /> Experiment saved
              </div>
              <p className="text-xs text-slate-500 font-mono">ID: {savedId.split('-')[0]}</p>
              <Link href={`/experiments/${savedId}`} className="button button-primary mt-2">
                View Experiment
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <button 
                type="button" 
                onClick={handleSave} 
                disabled={saveState === 'saving'} 
                className="button button-primary"
              >
                {saveState === 'saving' ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}
                {saveState === 'saving' ? "Saving..." : "Save Experiment"}
              </button>
              {saveState === 'error' && <p className="text-xs font-semibold text-red-600">{errorMessage}</p>}
            </div>
          )}
        </div>
      </div>
      <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500"><Info size={15} className="mt-0.5 shrink-0" /> Simulation completed successfully using seed {result.seed}. These are calculated possible outcomes based on historical distribution.</p>
    </section>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {resultMetrics.map((metric, index) => <div key={metric.label} className={`[&_.card]:h-full ${index === 7 ? "[&_.stat-value]:text-xl [&_.stat-value]:leading-8" : ""}`}><StatCard {...metric} tone={index === 0 ? "blue" : "indigo"} highlight={index === 0} /></div>)}
    </div>
    <Card><CardHeader title="Monte Carlo Price Distribution" description={`Histogram of ${formatNumber(parameters.iterations)} simulated prices`} icon={ChartColumn} action={<Badge tone="blue">Simulation distribution</Badge>} /><div className="px-3 pb-5 sm:px-6"><SimulatedPriceDistribution result={result} /></div></Card>
    <Card className="p-5 sm:p-6 [&>.card-header]:px-0 [&>.card-header]:pt-0">
      <CardHeader title="Probability Insights" description="Probabilities help describe a range of possible prices." />
      <div className="grid gap-4 md:grid-cols-4">{insightsArray.map((insight, index) => <div key={insight.label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-5"><p className="text-sm font-medium text-slate-700">{insight.label}</p><p className={`mt-3 font-mono text-3xl font-semibold ${index >= 2 ? "text-amber-600" : "text-blue-600"}`}>{insight.probability}%</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${index >= 2 ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${insight.probability}%` }} /></div><p className="mt-3 text-xs text-slate-500">{insight.note}</p></div>)}</div>
    </Card>
  </div>;
}
