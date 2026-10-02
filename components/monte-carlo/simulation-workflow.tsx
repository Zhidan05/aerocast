"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Database, Dices, Info, LoaderCircle, Play, RotateCcw, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatPrice } from "@/lib/format";
import { PriceDisplay } from "@/components/ui/price-display";
import { defaultParameters } from "@/lib/mock-data/dashboard";
import type { SimulationParameters } from "@/lib/types";
import type { MonteCarloResult } from "@/lib/monte-carlo";
import { SimulationFields, validateSimulationParameters } from "./simulation-fields";
import { ProbabilityStep } from "./probability-step";
import { RandomStep } from "./random-step";
import { ResultStep } from "./result-step";
import { v4 as uuidv4 } from "uuid";

const steps = ["Data Masukan", "Probabilitas", "Angka Acak", "Simulasi", "Hasil"];

export function SimulationWorkflow({ initialParameters = defaultParameters }: { initialParameters?: SimulationParameters }) {
  const [parameters, setParameters] = useState<SimulationParameters>(initialParameters);
  const [step, setStep] = useState(1);
  const [unlockedStep, setUnlockedStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  const [clientRunId, setClientRunId] = useState<string>(() => uuidv4());

  const [historicalData, setHistoricalData] = useState<any>(null);
  const [fetchingHistorical, setFetchingHistorical] = useState(false);

  const [previewResult, setPreviewResult] = useState<MonteCarloResult | null>(null);
  const [fetchingPreview, setFetchingPreview] = useState(false);

  const [finalResult, setFinalResult] = useState<MonteCarloResult | null>(null);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  // Lightweight preview on parameter change
  useEffect(() => {
    const handler = setTimeout(async () => {
      const validationError = validateSimulationParameters(parameters);
      if (validationError) { setError(validationError); setHistoricalData(null); return; }
      
      setFetchingHistorical(true);
      setError(null);
      setHistoricalData(null);
      setPreviewResult(null);
      setFinalResult(null);
      setCompleted(false);
      setProgress(0);
      setUnlockedStep(1);

      try {
        const res = await fetch("/api/historical-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceCity: parameters.source,
            destinationCity: parameters.destination,
            flightClass: parameters.cabinClass,
            daysLeft: parameters.daysLeft,
            tolerance: parameters.daysTolerance
          }),
        });
        const data = await res.json();
        if (res.ok) setHistoricalData(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setFetchingHistorical(false);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [parameters.source, parameters.destination, parameters.cabinClass, parameters.daysLeft, parameters.daysTolerance]);

  function navigate(next: number) {
    setStep(next);
    window.requestAnimationFrame(() => contentRef.current?.focus({ preventScroll: true }));
  }

  function resetWorkflow() {
    if (timer.current) clearInterval(timer.current);
    setRunning(false);
    setCompleted(false);
    setProgress(0);
    setUnlockedStep(1);
    setParameters({ ...parameters, seed: undefined });
    setClientRunId(uuidv4());
    setPreviewResult(null);
    setFinalResult(null);
    navigate(1);
  }

  function updateParameters(next: SimulationParameters) {
    setParameters(next);
    setClientRunId(uuidv4());
    if (error && error.includes("Iterations")) {
      setError(null);
    }
  }

  async function advance() {
    if (step === 1) {
      const validationError = validateSimulationParameters(parameters);
      if (validationError) { setError(validationError); return; }
      if (!historicalData || historicalData.count < 30) {
        setError("Data historis tidak mencukupi. Tingkatkan Toleransi Hari.");
        return;
      }

      // Execute preview Monte Carlo (10 iterations) to get buckets and sample numbers for Step 2 & 3
      if (!previewResult) {
        setFetchingPreview(true);
        setError(null);
        try {
          const res = await fetch("/api/monte-carlo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceCity: parameters.source,
              destinationCity: parameters.destination,
              flightClass: parameters.cabinClass,
              daysLeft: parameters.daysLeft,
              tolerance: parameters.daysTolerance,
              iterations: 100, // Preview (min 100 to pass validation)
              seed: parameters.seed
            }),
          });
          const data = await res.json();
          if (!res.ok) {
             setError(data.error + (data.suggestion ? ` ${data.suggestion}` : ""));
             setFetchingPreview(false);
             return;
          }
          setPreviewResult(data);
          
          // Since the seed might have been auto-generated on the server if it was undefined,
          // update the parameters so Step 4 uses the exactly same seed.
          setParameters((prev) => ({ ...prev, seed: data.seed }));
        } catch (err: any) {
          setError(err.message);
          setFetchingPreview(false);
          return;
        }
        setFetchingPreview(false);
      }
    }
    if (step === 4 && !completed) return;
    const next = Math.min(step + 1, 5);
    setUnlockedStep((previous) => Math.max(previous, next));
    navigate(next);
  }

  async function runSimulation() {
    if (running) return;
    setRunning(true);
    setCompleted(false);
    setProgress(10);
    
    // Call the API for the FULL Monte Carlo simulation with actual user iterations
    try {
      const res = await fetch("/api/monte-carlo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCity: parameters.source,
          destinationCity: parameters.destination,
          flightClass: parameters.cabinClass,
          daysLeft: parameters.daysLeft,
          tolerance: parameters.daysTolerance,
          iterations: parameters.iterations, // Full 10k/100k
          seed: parameters.seed,
          clientRunId
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFinalResult(data);
        setProgress(100);
        setRunning(false);
        setCompleted(true);
        setUnlockedStep(5);
        
        // Auto navigate to Step 5
        setTimeout(() => navigate(5), 400);
      } else {
        setError(data.error);
        setRunning(false);
      }
    } catch (err) {
      console.error(err);
      setRunning(false);
    }
  }

  async function regenerateSample() {
    const newSeed = Math.floor(Math.random() * 1000000);
    setParameters({ ...parameters, seed: newSeed });
    
    try {
      const res = await fetch("/api/monte-carlo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCity: parameters.source,
          destinationCity: parameters.destination,
          flightClass: parameters.cabinClass,
          daysLeft: parameters.daysLeft,
          tolerance: parameters.daysTolerance,
          iterations: 100,
          seed: newSeed
        }),
      });
      const data = await res.json();
      if (res.ok) setPreviewResult(data);
    } catch (err) {
      console.error(err);
    }
  }

  return <div className="page-stack">
    <PageHeader eyebrow="MONTE CARLO WORKSPACE" title="Monte Carlo Simulation" description="Explore the complete journey from historical prices to a probability-based fare estimate." actions={<button type="button" className="button button-secondary" onClick={resetWorkflow} disabled={running}><RotateCcw size={16} /> Mulai ulang alur kerja</button>} />
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-semibold"><Dices size={18} className="text-blue-600" /> Dari data ke prediksi</div><Badge tone="blue">Demo interaktif</Badge></div>
      <nav aria-label="Simulation steps"><ol className="grid gap-2 sm:grid-cols-5">{steps.map((label, index) => {
        const number = index + 1;
        const active = number === step;
        const finished = number < unlockedStep;
        return <li key={label}><button type="button" onClick={() => navigate(number)} disabled={number > unlockedStep || running} aria-current={active ? "step" : undefined} title={number > unlockedStep ? "Selesaikan langkah sebelumnya untuk melanjutkan" : label} className={`flex w-full items-center gap-2.5 rounded-xl p-3 text-left transition-colors disabled:cursor-not-allowed ${active ? "bg-blue-600 text-white shadow-sm" : "bg-indigo-50 text-slate-700 enabled:hover:bg-indigo-100 disabled:opacity-55"}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs ${active ? "bg-white text-blue-600" : finished ? "bg-green-600 text-white" : "bg-indigo-100 text-slate-500"}`}>{finished && !active ? <Check size={14} /> : `0${number}`}</span><span className="min-w-0"><span className={`block text-[10px] ${active ? "text-blue-100" : "text-slate-500"}`}>Tahap 0{number}</span><span className="block text-xs font-semibold xl:text-sm">{label}</span></span></button></li>;
      })}</ol></nav>
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500"><Info size={15} className="mt-0.5 shrink-0" /> Jelajahi model prediksi Monte Carlo menggunakan data aktual.</p>
    </Card>
    <div ref={contentRef} tabIndex={-1} className="outline-none" aria-label={`Stage ${step}: ${steps[step - 1]}`}>
      {step === 1 && <div className="grid items-start gap-5 xl:grid-cols-[1.45fr_1fr]">
        <Card className="p-5 sm:p-6 [&>.card-header]:px-0 [&>.card-header]:pt-0">
          <CardHeader title="Parameter Simulasi" description="Tentukan skenario penerbangan yang ingin dijelajahi." icon={SlidersHorizontal} action={<Badge tone="blue">Tahap 01</Badge>} />
          <SimulationFields value={parameters} onChange={updateParameters} includeTolerance />
          <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-xs leading-5 text-slate-600"><span className="font-semibold text-indigo-700">Cara kerja toleransi</span><p className="mt-1">Jendela 7 hari dengan ±1 hari mencakup observasi historis dari hari ke-6 hingga ke-8. Memperlebar jendela dapat memberikan lebih banyak sampel.</p></div>
          {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </Card>
        <Card className="p-5 sm:p-6 [&>.card-header]:px-0 [&>.card-header]:pt-0">
          <CardHeader title="Data Historis yang Cocok" description={`Subset aktual · ${parameters.source} → ${parameters.destination}, ${parameters.cabinClass === "Business" ? "Bisnis" : "Ekonomi"}`} icon={Database} />
          {fetchingHistorical ? <div className="p-4 text-center text-sm text-slate-500"><LoaderCircle className="mx-auto mb-2 animate-spin text-blue-600" size={24} /> Meminta subset...</div> : historicalData && historicalData.count > 0 ? <>
            <div className="mb-5 flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3"><span className="text-sm font-medium text-indigo-900">Rekam Data yang Cocok</span><span className="font-mono text-3xl font-semibold text-indigo-600">{formatNumber(historicalData.count)}</span></div>
            <dl className="grid grid-cols-2 gap-x-5 gap-y-5">
              <div><dt className="text-xs text-slate-500">Harga Rata-rata</dt><dd className="mt-1 font-mono text-xl font-semibold"><PriceDisplay amount={historicalData.summary.mean} /></dd></div>
              <div><dt className="text-xs text-slate-500"><abbr title="Sebaran harga historis yang khas di sekitar rata-ratanya">Standar Deviasi</abbr></dt><dd className="mt-1 font-mono text-xl font-semibold"><PriceDisplay amount={historicalData.summary.stdDev} /></dd></div>
              <div><dt className="text-xs text-slate-500">Harga Minimum</dt><dd className="mt-1 font-mono text-sm font-semibold"><PriceDisplay amount={historicalData.summary.min} /></dd></div>
              <div><dt className="text-xs text-slate-500">Harga Maksimum</dt><dd className="mt-1 font-mono text-sm font-semibold"><PriceDisplay amount={historicalData.summary.max} /></dd></div>
            </dl>
            <div className={`mt-5 flex items-center gap-2 rounded-lg p-3 text-xs ${historicalData.count < 30 ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}><CheckCircle2 size={15} /> {formatNumber(historicalData.count)} rekam data dalam subset</div>
            {historicalData.count < 30 && <p className="mt-3 text-xs leading-5 text-amber-600 font-semibold">Sampel tidak mencukupi (minimal 30 diperlukan). Harap tingkatkan Toleransi Hari.</p>}
          </> : <p className="text-sm text-slate-500">Tidak ada data yang tersedia. Coba tingkatkan toleransi.</p>}
        </Card>
      </div>}
      {step === 2 && previewResult && <ProbabilityStep result={previewResult} />}
      {step === 3 && previewResult && <RandomStep result={previewResult} onRegenerate={regenerateSample} />}
      {step === 4 && previewResult && <Card className="p-5 sm:p-6 [&>.card-header]:px-0 [&>.card-header]:pt-0">
        <CardHeader title="Eksperimen Monte Carlo" description="Tinjau skenario, lalu jalankan simulasi." icon={Dices} action={<Badge tone={completed ? "green" : "blue"}>{completed ? "Simulasi selesai" : running ? "Sedang berlangsung" : "Siap dijalankan"}</Badge>} />
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[
          ["Rute", `${parameters.source} → ${parameters.destination}`], ["Kelas Kabin", parameters.cabinClass === "Business" ? "Bisnis" : "Ekonomi"], ["Hari Sebelum Keberangkatan", `${parameters.daysLeft} ± ${parameters.daysTolerance} hari`], ["Sampel Historis", formatNumber(previewResult.historicalSampleCount)], ["Simulasi", formatNumber(parameters.iterations)],
        ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-2 text-sm font-semibold text-slate-800">{value}</dd></div>)}</dl>
        <div className="my-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-6 sm:p-8">
          <div className="mb-4 flex items-center justify-between gap-4"><div className="flex items-center gap-2 font-semibold text-slate-800">{running ? <LoaderCircle className="animate-spin text-blue-600" size={20} /> : completed ? <CheckCircle2 className="text-green-600" size={20} /> : <Play className="text-blue-600" size={20} />}<span role="status">{running ? "Menjalankan Simulasi Monte Carlo..." : completed ? "Simulasi Selesai" : "Siap untuk menjelajahi kemungkinan hasil"}</span></div><span className="font-mono text-sm text-blue-600">{progress}%</span></div>
          <div role="progressbar" aria-label="Simulation progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-2.5 overflow-hidden rounded-full bg-indigo-100"><div className="h-full rounded-full bg-blue-600 transition-[width] duration-300 ease-out" style={{ width: `${progress}%` }} /></div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4"><p className="max-w-xl text-xs leading-5 text-slate-500">Parameter telah diatur. Klik di bawah untuk menjalankan penuh {formatNumber(parameters.iterations)} iterasi.</p><button type="button" onClick={runSimulation} className="button button-primary" disabled={running}>{running ? <LoaderCircle className="animate-spin" size={16} /> : <Play size={16} />}{running ? "Menjalankan..." : completed ? "Jalankan Simulasi Lagi" : "Jalankan Simulasi"}</button></div>
      </Card>}
      {step === 5 && finalResult && <ResultStep result={finalResult} />}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
      <button type="button" className="button button-secondary" onClick={() => navigate(step - 1)} disabled={step === 1 || running}><ArrowLeft size={16} /> Sebelumnya</button>
      <span className="text-xs text-slate-500">Langkah {step} dari 5 · {steps[step - 1]}</span>
      {step < 5 ? <button type="button" className="button button-primary" onClick={advance} disabled={running || fetchingPreview || (step === 4 && !completed)}>{fetchingPreview ? <LoaderCircle className="animate-spin" size={16} /> : null}{step === 4 ? "Lihat Hasil Prediksi" : `Lanjut ke ${steps[step]}`}<ArrowRight size={16} /></button> : <button type="button" className="button button-secondary" onClick={resetWorkflow}><RotateCcw size={16} /> Simulasi Baru</button>}
    </div>
  </div>;
}
