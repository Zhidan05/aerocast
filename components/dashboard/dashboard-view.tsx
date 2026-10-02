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
    <PageHeader eyebrow="RINGKASAN RUANG KERJA" title="Dasbor Prediksi Harga Tiket Penerbangan" description="Jelajahi harga historis maskapai dan jalankan simulasi Monte Carlo untuk mengestimasi distribusi kemungkinan harga tiket." actions={<button className="button button-primary" onClick={() => { formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); formRef.current?.querySelector("select")?.focus({ preventScroll: true }); }}><Plus size={15} />Jalankan Simulasi Baru</button>} />
    <div className="stat-grid">
      <StatCard label="Total Rekam Data" value={datasetSummary ? formatNumber(datasetSummary.total_records) : "300,153"} helper="Harga tiket aktual" icon={Database} tone="blue" />
      <StatCard label="Maskapai & Rute" value={datasetSummary ? `${datasetSummary.airlines} / ${datasetSummary.routes}` : "6 / 12"} helper="Maskapai dan rute yang unik" icon={Plane} tone="indigo" />
      <StatCard label="Rata-rata MAPE" value={accuracySummary?.average_mape ? `${Number(accuracySummary.average_mape).toFixed(2)}%` : "—"} helper="Rata-rata Kesalahan Persentase Absolut" icon={ChartNoAxesCombined} tone="green" />
      <StatCard label="Rata-rata Cakupan" value={accuracySummary?.average_interval_coverage ? `${Number(accuracySummary.average_interval_coverage).toFixed(2)}%` : "—"} helper="Harga di dalam interval 95%" icon={History} tone="amber" />
    </div>

    <Card>
      <CardHeader title="Simulasi Cepat Monte Carlo" description="Atur parameter penerbangan dan lihat contoh distribusi prediksi." icon={SlidersHorizontal} action={<Badge><Dices size={12} />Pratinjau Monte Carlo</Badge>} />
      <form ref={formRef} onSubmit={runPreview} className="px-5 pb-5 sm:px-6 sm:pb-6" noValidate>
        <SimulationFields value={parameters} onChange={updateParameters} disabled={status === "running"} compact />
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{error}</p>}
        <div className="mt-5 flex flex-col justify-between gap-4 rounded-lg bg-slate-50 px-4 py-3 sm:flex-row sm:items-center">
          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-500"><Info size={14} className="mt-0.5 shrink-0 text-blue-500" /><span>Demo interaktif · Hasil menggunakan dataset ilustrasi tetap.</span></p>
          <button type="submit" className="button button-primary shrink-0" disabled={status === "running"}>{status === "running" ? <LoaderCircle size={16} className="animate-spin" /> : <Dices size={16} />}{status === "running" ? "Menyiapkan demo…" : "Jalankan Simulasi Monte Carlo"}</button>
        </div>
      </form>
    </Card>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3"><h2 className="text-sm">Ringkasan prediksi</h2><Badge tone={status === "complete" ? "green" : "slate"}>{status === "complete" ? <><Check size={12} />Demo selesai</> : "Contoh hasil"}</Badge></div>
      <span className="font-mono text-[10px] text-slate-500">Delhi → Mumbai · Ekonomi · 7 hari · 10.000 iterasi</span>
    </div>
    <div aria-live="polite" className={status === "example" ? "sr-only" : "-mt-3 text-xs text-slate-500"}>
      {status === "complete" ? `Pratinjau disiapkan untuk ${submitted.source} → ${submitted.destination}, ${submitted.cabinClass}, ${submitted.daysLeft} hari, ${formatNumber(submitted.iterations)} iterasi. Contoh nilai di bawah ini tetap.` : status === "edited" ? "Parameter diubah. Jalankan simulasi untuk melihat perubahan; contoh di bawah ini tetap sama." : status === "running" ? "Menyiapkan pratinjau demo interaktif Anda…" : "Menampilkan hasil ilustrasi."}
    </div>
    <div className="stat-grid">{predictionMetrics.map((metric, index) => <StatCard key={metric.label} {...metric} value={<PriceDisplay amount={metric.value} />} highlight={index === 0} />)}</div>
    <div className="chart-grid">
      <Card><CardHeader title="Distribusi Harga Monte Carlo" description="Distribusi kemungkinan harga di seluruh 10.000 iterasi contoh." icon={ChartNoAxesCombined} action={<Badge>10.000 iterasi</Badge>} /><div className="px-3 pb-5 sm:px-6"><PriceDistribution /><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-[10px] text-slate-500"><span>Distribusi ilustratif · bukan jaminan harga</span><span className="font-mono">INR (₹)</span></div></div></Card>
      <Card><CardHeader title="Ringkasan Probabilitas" description="Peluang harga tiket berada di setiap rentang." action={<span className="font-mono text-[10px] text-slate-400">Σ 100%</span>} /><div className="px-6 pb-6"><ProbabilityBars items={probabilityBands} /><div className="mt-6 rounded-lg bg-indigo-50/80 p-4"><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-indigo-800"><ChartNoAxesCombined size={16} />Membaca distribusi</div><p className="text-[11px] leading-7 text-slate-600">Dalam contoh ini, <strong className="font-semibold text-indigo-700">64,1%</strong> harga hasil simulasi berada di bawah ₹10.000. Ekor yang lebih lebar menunjukkan hasil harga yang lebih jarang.</p><Link href="/monte-carlo" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600">Pelajari alur kerja lengkap <ArrowRight size={13} /></Link></div></div></Card>
    </div>
    <Card>
      <CardHeader title="Eksperimen Simulasi Terbaru" description="Eksperimen yang disimpan dari database." icon={History} action={<Link href="/experiments" className="button button-secondary">Lihat semua <ArrowRight size={14} /></Link>} />
      <DataTable label="Eksperimen simulasi terbaru">
        <thead><tr>{["Eksperimen","Rute & Kelas","Hari Tersisa","Iterasi","Estimasi Harga","Median"].map(label => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>
          {recentRuns.length > 0 ? recentRuns.map(run => <tr key={run.id}><td className="font-mono text-xs font-semibold text-slate-600">{run.id.split('-')[0]}</td><td><span className="font-medium">{run.source_city} → {run.destination_city}</span><span className="ml-2 text-xs text-slate-400">{run.class}</span></td><td>{run.days_left} hari</td><td className="font-mono text-xs">{formatNumber(run.iteration_count)}</td><td className="font-mono text-xs font-medium text-blue-600"><PriceDisplay amount={run.mean_price} inline /></td><td className="font-mono text-xs"><PriceDisplay amount={run.median_price} inline /></td></tr>) : <tr><td colSpan={6} className="py-6 text-center text-sm text-slate-500">Belum ada simulasi terbaru.</td></tr>}
        </tbody>
      </DataTable>
      <div className="table-footer"><span>Data aktual · Eksperimen sungguhan</span></div>
    </Card>
  </div>;
}
