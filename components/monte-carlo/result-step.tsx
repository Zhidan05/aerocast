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
        setErrorMessage(data.error || "Gagal menyimpan eksperimen.");
        setSaveState('error');
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Kesalahan jaringan.");
      setSaveState('error');
    }
  }
  
  const resultMetrics = [
    { label: "Estimasi Harga (Rata-rata)", value: <PriceDisplay amount={statistics.mean} /> },
    { label: "Harga Median (P50)", value: <PriceDisplay amount={statistics.median} /> },
    { label: "Harga Minimum", value: <PriceDisplay amount={statistics.min} /> },
    { label: "Harga Maksimum", value: <PriceDisplay amount={statistics.max} /> },
    { label: "Standar Deviasi", value: <PriceDisplay amount={statistics.stdDev} /> },
    { label: "Persentil ke-25", value: <PriceDisplay amount={statistics.percentiles.p25} /> },
    { label: "Persentil ke-75", value: <PriceDisplay amount={statistics.percentiles.p75} /> },
    { label: "Interval Simulasi 95%", value: <span className="flex items-center gap-1"><PriceDisplay amount={statistics.percentiles.p2_5} inline /> - <PriceDisplay amount={statistics.percentiles.p97_5} inline /></span> },
  ];

  const insightsArray = [
    { label: probabilityInsights.belowP25.label, probability: (probabilityInsights.belowP25.percentage * 100).toFixed(2), note: "Skenario yang sangat menguntungkan." },
    { label: probabilityInsights.p25ToP50.label, probability: (probabilityInsights.p25ToP50.percentage * 100).toFixed(2), note: "Di bawah median." },
    { label: probabilityInsights.p50ToP75.label, probability: (probabilityInsights.p50ToP75.percentage * 100).toFixed(2), note: "Di atas median." },
    { label: probabilityInsights.aboveP75.label, probability: (probabilityInsights.aboveP75.percentage * 100).toFixed(2), note: "Skenario yang kurang menguntungkan." },
  ];

  return <div className="page-stack">
    <section className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 sm:p-8" aria-label="Prediction result">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div><Badge tone="blue">Hasil prediksi</Badge><h2 className="mt-4 text-sm font-medium text-slate-600">Estimasi Harga Tiket</h2><p className="mt-2 font-mono text-4xl font-semibold tracking-tight text-blue-600 sm:text-5xl"><PriceDisplay amount={statistics.mean} showInfo /></p><p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">Berdasarkan {formatNumber(parameters.iterations)} simulasi Monte Carlo menggunakan {formatNumber(result.historicalSampleCount)} observasi historis untuk <strong className="font-semibold text-slate-800">{parameters.sourceCity} → {parameters.destinationCity}</strong>, {parameters.flightClass === "Business" ? "Bisnis" : "Ekonomi"}, {parameters.daysLeft} hari sebelum keberangkatan.</p></div>
        
        <div className="flex flex-col items-end gap-2">
          {saveState === 'saved' && savedId ? (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                <CheckCircle2 size={16} /> Eksperimen disimpan
              </div>
              <p className="text-xs text-slate-500 font-mono">ID: {savedId.split('-')[0]}</p>
              <Link href={`/experiments/${savedId}`} className="button button-primary mt-2">
                Lihat Eksperimen
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
                {saveState === 'saving' ? "Menyimpan..." : "Simpan Eksperimen"}
              </button>
              {saveState === 'error' && <p className="text-xs font-semibold text-red-600">{errorMessage}</p>}
            </div>
          )}
        </div>
      </div>
      <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500"><Info size={15} className="mt-0.5 shrink-0" /> Simulasi berhasil diselesaikan menggunakan seed {result.seed}. Ini adalah perhitungan kemungkinan hasil berdasarkan distribusi historis.</p>
    </section>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {resultMetrics.map((metric, index) => <div key={metric.label} className={`[&_.card]:h-full ${index === 7 ? "[&_.stat-value]:text-xl [&_.stat-value]:leading-8" : ""}`}><StatCard {...metric} tone={index === 0 ? "blue" : "indigo"} highlight={index === 0} /></div>)}
    </div>
    <Card><CardHeader title="Distribusi Harga Monte Carlo" description={`Histogram dari ${formatNumber(parameters.iterations)} harga yang disimulasikan`} icon={ChartColumn} action={<Badge tone="blue">Distribusi simulasi</Badge>} /><div className="px-3 pb-5 sm:px-6"><SimulatedPriceDistribution result={result} /></div></Card>
    <Card className="p-5 sm:p-6 [&>.card-header]:px-0 [&>.card-header]:pt-0">
      <CardHeader title="Wawasan Probabilitas" description="Probabilitas membantu menggambarkan rentang kemungkinan harga." />
      <div className="grid gap-4 md:grid-cols-4">{insightsArray.map((insight, index) => <div key={insight.label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-5"><p className="text-sm font-medium text-slate-700">{insight.label}</p><p className={`mt-3 font-mono text-3xl font-semibold ${index >= 2 ? "text-amber-600" : "text-blue-600"}`}>{insight.probability}%</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${index >= 2 ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${insight.probability}%` }} /></div><p className="mt-3 text-xs text-slate-500">{insight.note}</p></div>)}</div>
    </Card>
  </div>;
}
