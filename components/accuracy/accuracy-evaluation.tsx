"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronDown, Database, Download, Gauge, Layers3, Percent, Search, Target, Users, Settings2, Play, LoaderCircle, Info, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { AccuracyCharts } from "./accuracy-charts";
import { downloadFile, formatPrice, formatNumber } from "@/lib/format";
import { SimulationFields } from "@/components/monte-carlo/simulation-fields";
import { PriceDisplay } from "@/components/ui/price-display";
import { AccuracyEvaluationResult } from "@/lib/accuracy/types";
import { SimulationParameters } from "@/lib/types";

const initialParams: SimulationParameters = {
  source: "Delhi",
  destination: "Mumbai",
  cabinClass: "Economy",
  daysLeft: 7,
  daysTolerance: 1,
  iterations: 10000,
};

import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";
import { Link as LinkIcon, Unlink } from "lucide-react";

export function AccuracyEvaluation({ simulationId: initialSimulationId }: { simulationId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [params, setParams] = useState<SimulationParameters>(initialParams);
  const [calibrationRatio, setCalibrationRatio] = useState(0.8);
  const [splitSeed, setSplitSeed] = useState(2026);
  const [monteCarloSeed, setMonteCarloSeed] = useState(123456);

  const activeSimulationId = searchParams.get('simulationId') || initialSimulationId;
  const [linkedLoading, setLinkedLoading] = useState(!!activeSimulationId);
  const [linkedError, setLinkedError] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AccuracyEvaluationResult | null>(null);
  
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [clientRunId, setClientRunId] = useState<string>(() => uuidv4());

  const [page, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  useEffect(() => {
    if (activeSimulationId) {
      setLinkedLoading(true);
      setLinkedError(false);
      fetch(`/api/experiments/${activeSimulationId}`)
        .then(res => {
          if (!res.ok) throw new Error('Experiment not found');
          return res.json();
        })
        .then(data => {
          if (data && data.simulation) {
            const s = data.simulation;
            setParams({
              source: s.source_city,
              destination: s.destination_city,
              cabinClass: s.class,
              daysLeft: s.days_left,
              daysTolerance: s.days_tolerance,
              iterations: s.iteration_count,
              seed: s.seed || undefined
            });
            if (s.seed) setMonteCarloSeed(s.seed);
            setLinkedLoading(false);
          } else {
            throw new Error('Simulation missing');
          }
        })
        .catch(err => {
          console.error(err);
          setLinkedError(true);
          setLinkedLoading(false);
        });
    } else {
      setLinkedLoading(false);
      setLinkedError(false);
    }
  }, [activeSimulationId]);

  async function runEvaluation() {
    setLoading(true);
    setError(null);
    setResult(null);
    setSaveState('idle');
    setSavedId(null);
    setClientRunId(uuidv4());
    setPage(1);

    try {
      const res = await fetch("/api/accuracy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCity: params.source,
          destinationCity: params.destination,
          flightClass: params.cabinClass,
          daysLeft: params.daysLeft,
          tolerance: params.daysTolerance,
          calibrationRatio,
          iterations: params.iterations,
          splitSeed,
          monteCarloSeed,
          simulationId: activeSimulationId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error + (data.suggestion ? ` ${data.suggestion}` : ""));
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to run evaluation");
    } finally {
      setLoading(false);
    }
  }

  async function saveEvaluation() {
    if (saveState === 'saving' || saveState === 'saved') return;
    setSaveState('saving');
    try {
      const res = await fetch("/api/accuracy-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result,
          simulationId: activeSimulationId,
          clientRunId
        })
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setSavedId(data.id);
        setSaveState('saved');
      } else {
        setError(data.error || "Failed to save evaluation");
        setSaveState('error');
      }
    } catch (err: any) {
      setError(err.message || "Network error");
      setSaveState('error');
    }
  }

  const exportReport = () => {
    if (!result) return;
    const csv = [
      "ID,Actual Price,Expected Price,Error,Absolute Error,Percentage Error,Inside 95% Interval",
      ...result.observations.map((row) => `${row.id},${row.actualPrice},${row.predictedPrice},${row.error},${row.absoluteError},${row.percentageError},${row.inside95Interval ? "Yes" : "No"}`)
    ].join("\r\n");
    downloadFile("aerocast-evaluation-observations.csv", `\uFEFF${csv}`, "text/csv;charset=utf-8;");
  };

  const obs = result?.observations || [];
  const filtered = [...obs];
  if (sortDirection) {
    filtered.sort((a, b) => sortDirection === "asc" ? a.percentageError - b.percentageError : b.percentageError - a.percentageError);
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const SortIcon = sortDirection === "asc" ? ArrowUp : sortDirection === "desc" ? ArrowDown : ArrowUpDown;

  return <div className="page-stack [&_.card-header]:p-0">
    <PageHeader eyebrow="UNDERSTAND THE UNCERTAINTY" title="Prediction Accuracy" description="Evaluate Monte Carlo predictions against reserved historical evaluation data." actions={<button className="button button-primary" onClick={exportReport} disabled={!result}><Download size={16} /> Export observations</button>} />
    
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 mb-2">
        <CardHeader title="Evaluation Configuration" description="Set parameters and run the accuracy evaluation." icon={Settings2} />
        {activeSimulationId && !linkedLoading && !linkedError && (
          <Link href="/accuracy" className="button button-secondary shrink-0 text-xs">
            <Unlink size={14} /> Evaluate as standalone
          </Link>
        )}
      </div>

      <div className="mt-6 mb-6">
        {linkedLoading ? (
          <div className="flex flex-col items-center justify-center p-8 border border-blue-100 rounded-xl bg-slate-50">
            <LoaderCircle className="animate-spin text-blue-500 mb-2" size={24} />
            <p className="text-sm font-medium text-slate-600">Loading linked experiment...</p>
          </div>
        ) : linkedError ? (
          <div className="p-5 rounded-xl border border-red-200 bg-red-50 text-center">
            <p className="text-sm font-medium text-red-800 mb-3">Linked experiment could not be found.</p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/experiments" className="button button-secondary">Back to Experiments</Link>
              <Link href="/accuracy" className="button button-primary">Start Standalone Evaluation</Link>
            </div>
          </div>
        ) : activeSimulationId ? (
          <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5"><LinkIcon size={18} className="text-indigo-600" /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-indigo-900 text-sm">Linked to Experiment</h3>
                  <Badge tone="blue">{activeSimulationId.split('-')[0]}</Badge>
                </div>
                <p className="text-xs text-slate-600 mb-4">Flight scenario and Monte Carlo settings are inherited from the saved experiment.</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/60 p-4 rounded-lg border border-indigo-100/50">
                  <div><span className="block text-xs text-slate-500 mb-0.5">Route</span><span className="font-semibold text-sm text-slate-800">{params.source} → {params.destination}</span></div>
                  <div><span className="block text-xs text-slate-500 mb-0.5">Class</span><span className="font-semibold text-sm text-slate-800">{params.cabinClass}</span></div>
                  <div><span className="block text-xs text-slate-500 mb-0.5">Days Before</span><span className="font-semibold text-sm text-slate-800">{params.daysLeft}</span></div>
                  <div><span className="block text-xs text-slate-500 mb-0.5">Tolerance</span><span className="font-semibold text-sm text-slate-800">±{params.daysTolerance}</span></div>
                  <div><span className="block text-xs text-slate-500 mb-0.5">Iterations</span><span className="font-mono font-semibold text-sm text-slate-800">{formatNumber(params.iterations)}</span></div>
                  <div><span className="block text-xs text-slate-500 mb-0.5">Monte Carlo Seed</span><span className="font-mono font-semibold text-sm text-slate-800">{monteCarloSeed}</span></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <SimulationFields value={params} onChange={setParams} includeTolerance disabled={loading} compact />
        )}
      </div>

      <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
        <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2 mb-2"><Info size={16} className="text-blue-600" />How evaluation works</h3>
        <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1 ml-1">
          <li>Historical observations are split into calibration and evaluation data.</li>
          <li>Calibration data builds the Monte Carlo probability distribution.</li>
          <li>Evaluation data is held out and never used to build the distribution.</li>
          <li>The resulting expected price and simulation interval are compared against the held-out observations.</li>
        </ol>
      </div>
      
      <div className="mb-6 pt-6 border-t border-slate-100">
        <div className="mb-4">
          <span className="block text-sm font-medium text-slate-800 mb-1">Evaluation Setup</span>
          <p className="text-sm font-semibold text-blue-700">Data Split: {Math.round(calibrationRatio * 100)}% Calibration / {Math.round((1 - calibrationRatio) * 100)}% Evaluation</p>
          <p className="text-xs text-slate-500 mt-1">Calibration data is used to build the Monte Carlo distribution. Evaluation data is kept separate and used to measure prediction quality.</p>
        </div>

        <details className="group border border-slate-200 rounded-lg open:bg-slate-50">
          <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-sm text-slate-700 group-open:border-b group-open:border-slate-200 hover:bg-slate-50">
            Advanced Settings
            <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="p-4 grid gap-4 sm:grid-cols-3">
            <label className="field">
              <span className="field-label">Calibration Ratio</span>
              <select className="select" value={calibrationRatio} onChange={(e) => setCalibrationRatio(Number(e.target.value))} disabled={loading}>
                <option value={0.7}>70 / 30</option>
                <option value={0.75}>75 / 25</option>
                <option value={0.8}>80 / 20</option>
                <option value={0.85}>85 / 15</option>
                <option value={0.9}>90 / 10</option>
              </select>
            </label>
            <label className="field">
              <span className="field-label flex items-center justify-between">
                <span title="Controls how historical observations are reproducibly divided into calibration and evaluation data. The same seed produces the same split." className="cursor-help border-b border-dotted border-slate-400">Split Seed</span>
              </span>
              <input className="input" type="number" value={splitSeed} onChange={(e) => setSplitSeed(Number(e.target.value))} disabled={loading} />
            </label>
            <label className="field">
              <span className="field-label flex items-center justify-between">
                <span title="Controls the pseudo-random sequence used during Monte Carlo simulation. The same seed and data produce reproducible simulation results." className="cursor-help border-b border-dotted border-slate-400">Monte Carlo Seed</span>
              </span>
              <input className="input" type="number" value={monteCarloSeed} onChange={(e) => setMonteCarloSeed(Number(e.target.value))} disabled={loading || !!activeSimulationId} />
            </label>
          </div>
        </details>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <p className="text-xs text-slate-500 max-w-2xl">This will fetch the dataset, deterministically split it, run a full Monte Carlo simulation on the calibration set, and evaluate the resulting expected price and distribution against the held-out evaluation set.</p>
        <button className="button button-primary" onClick={runEvaluation} disabled={loading}>
          {loading ? <LoaderCircle className="animate-spin" size={16} /> : <Play size={16} />} 
          {loading ? "Running Evaluation..." : "Run Evaluation"}
        </button>
      </div>
    </Card>

    {result && (
      <>
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-xl border border-blue-200 bg-blue-50/50">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Evaluation Completed</h3>
            <p className="text-xs text-slate-500 mt-1">Review the metrics below. You can save this evaluation snapshot.</p>
            {activeSimulationId && <div className="mt-2 text-xs font-medium text-indigo-700 flex items-center gap-1.5"><CheckCircle2 size={14} /> Linked to Experiment {activeSimulationId.split('-')[0]}</div>}
          </div>
          <div className="flex items-center gap-3">
            {saveState === 'saved' && savedId ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-green-700 flex items-center gap-1"><CheckCircle2 size={14} /> Saved</span>
                {activeSimulationId ? (
                  <Link href={`/experiments/${activeSimulationId}`} className="button button-primary">View Experiment</Link>
                ) : (
                  <span className="text-xs text-slate-500">Saved as standalone</span>
                )}
              </div>
            ) : (
              <button className="button button-primary" onClick={saveEvaluation} disabled={saveState === 'saving'}>
                {saveState === 'saving' ? <LoaderCircle className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                {saveState === 'saving' ? "Saving..." : "Save Evaluation"}
              </button>
            )}
          </div>
        </div>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="min-w-0 lg:w-[40%]"><CardHeader title="Data Partitioning" description="A deterministic split keeps evaluation data separate from the calibration corpus." icon={Layers3} /></div>
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 font-medium text-blue-700"><span className="size-2 rounded-full bg-blue-600" /> Calibration {Math.round(result.split.calibrationCount / result.split.totalCount * 100)}% <span className="font-mono text-slate-500">{formatNumber(result.split.calibrationCount)}</span></span>
                <span className="flex items-center gap-2 font-medium text-indigo-600"><span className="size-2 rounded-full bg-indigo-500" /> Evaluation {Math.round(result.split.evaluationCount / result.split.totalCount * 100)}% <span className="font-mono text-slate-500">{formatNumber(result.split.evaluationCount)}</span></span>
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`Calibration: ${result.split.calibrationCount} records. Evaluation: ${result.split.evaluationCount} records.`}>
                <div className="bg-blue-600" style={{ width: `${(result.split.calibrationCount / result.split.totalCount) * 100}%` }} />
                <div className="bg-indigo-500" style={{ width: `${(result.split.evaluationCount / result.split.totalCount) * 100}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>{formatNumber(result.split.totalCount)} Historical Observations</span>
                <Badge tone="green">Real evaluation</Badge>
              </div>
            </div>
          </div>
        </Card>

        <div className="stat-grid">
          <StatCard label="MAE" value={<PriceDisplay amount={result.metrics.mae} />} helper="Mean absolute price error" icon={Target} tooltip="Mean Absolute Error: average absolute difference between actual and expected fares. Lower is better." />
          <StatCard label="MAPE" value={`${result.metrics.mape.toFixed(2)}%`} helper="Primary evaluation metric" icon={Percent} tone="indigo" highlight tooltip="Mean Absolute Percentage Error: average absolute error relative to each actual fare. Lower is better." />
          <StatCard label="RMSE" value={<PriceDisplay amount={result.metrics.rmse} />} helper="Emphasizes larger errors" icon={Gauge} tooltip="Root Mean Squared Error: the square root of the average squared prediction error, expressed in INR." />
          <StatCard label="95% Coverage" value={`${result.metrics.intervalCoverage.toFixed(2)}%`} helper={`${result.metrics.insideIntervalCount} of ${result.split.evaluationCount} inside interval`} icon={Layers3} tooltip="Percentage of evaluation observations that fall inside the Monte Carlo 95% simulation interval." />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50">
          <div><span className="block text-xs text-slate-500 mb-1">Expected Price</span><span className="font-mono font-semibold text-slate-800"><PriceDisplay amount={result.monteCarlo.expectedPrice} /></span></div>
          <div><span className="block text-xs text-slate-500 mb-1">Bias / Mean Error</span><span className="font-mono font-semibold text-slate-800"><PriceDisplay amount={result.metrics.bias} /></span></div>
          <div><span className="block text-xs text-slate-500 mb-1">95% Interval</span><span className="font-mono font-semibold text-slate-800 flex items-center gap-1"><PriceDisplay amount={result.monteCarlo.p2_5} inline /> – <PriceDisplay amount={result.monteCarlo.p97_5} inline /></span></div>
          <div><span className="block text-xs text-slate-500 mb-1">95% Interval Width</span><span className="font-mono font-semibold text-slate-800"><PriceDisplay amount={result.metrics.intervalWidth} /></span></div>
        </div>

        <AccuracyCharts observations={result.observations} histogram={result.errorHistogram} />

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <CardHeader title="Evaluation Observations" description="Detailed review of held-out evaluation samples against the expected price" />
          </div>
          <DataTable label="Evaluation observations">
            <thead><tr><th>ID</th><th className="text-right">Actual Price</th><th className="text-right">Expected</th><th className="text-right">Error</th><th className="text-right" aria-sort={sortDirection === "asc" ? "ascending" : sortDirection === "desc" ? "descending" : "none"}><button className="inline-flex items-center gap-1.5 hover:text-blue-700" onClick={() => { setSortDirection(sortDirection === "asc" ? "desc" : "asc"); setPage(1); }}>MAPE<SortIcon size={13} aria-hidden="true" /></button></th><th className="text-center">Inside 95%</th></tr></thead>
            <tbody>{visibleRows.map((row) => <tr key={row.id}>
              <td><span className="font-mono text-xs text-slate-500">{row.id}</span></td>
              <td className="text-right font-mono text-xs font-semibold"><PriceDisplay amount={row.actualPrice} inline /></td>
              <td className="text-right font-mono text-xs text-slate-500"><PriceDisplay amount={row.predictedPrice} inline /></td>
              <td className="text-right font-mono text-xs"><span className={`flex justify-end ${row.error > 0 ? "text-red-600" : "text-green-600"}`}>{row.error > 0 ? "+" : ""}<PriceDisplay amount={Math.abs(row.error)} inline /></span></td>
              <td className="text-right font-mono text-xs font-semibold text-blue-700">{(row.percentageError * 100).toFixed(1)}%</td>
              <td className="text-center">{row.inside95Interval ? <Badge tone="green">Yes</Badge> : <Badge tone="amber">No</Badge>}</td>
            </tr>)}</tbody>
          </DataTable>
          {filtered.length === 0 && <div className="p-12 text-center"><p className="font-medium text-slate-700">No observations</p></div>}
          <div className="table-footer flex-wrap gap-3"><p className="text-xs text-slate-500" aria-live="polite">Showing {filtered.length === 0 ? 0 : (currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, filtered.length)} of {filtered.length} observations</p><div className="flex items-center gap-3"><button className="button button-secondary p-2" aria-label="Previous page" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft size={16} /></button><span className="text-xs text-slate-600">{currentPage} / {totalPages}</span><button className="button button-secondary p-2" aria-label="Next page" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight size={16} /></button></div></div>
        </Card>
      </>
    )}
  </div>;
}
