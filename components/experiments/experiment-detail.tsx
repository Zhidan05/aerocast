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
      <CardHeader title={`${experiment.id.split('-')[0]} · Detail eksperimen`} description="Tampilan transparan dari masukan, model probabilitas, dan hasil ilustrasi." icon={FileChartColumn} action={<button className="button button-ghost" aria-label="Close experiment detail" onClick={onClose}><X size={18} /></button>} />
      <div className="flex flex-col justify-between gap-6 border-y border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50/40 px-6 py-6 sm:flex-row sm:items-center">
        <div><span className="text-xs font-semibold tracking-wider text-blue-700 uppercase">Estimasi harga tiket</span><p className="my-2 font-mono text-4xl font-semibold tracking-tight text-blue-700"><PriceDisplay amount={experiment.mean_price} showInfo /></p><p className="text-sm text-slate-600">{experiment.source_city} → {experiment.destination_city} · {experiment.class === "Business" ? "Bisnis" : "Ekonomi"}</p></div>
        <div className="space-y-2 text-sm text-slate-600"><Badge tone="blue">Hasil aktual</Badge><p>{formatNumber(experiment.iteration_count)} iterasi Monte Carlo</p><p>{experiment.days_left} hari sebelum keberangkatan · toleransi ±{experiment.days_tolerance} hari</p></div>
      </div>
      <div className="flex flex-wrap gap-2 p-5 sm:px-6"><Link href={`/monte-carlo?${runAgainQuery.toString()}`} className="button button-primary"><Play size={15} />Jalankan Lagi</Link><button onClick={onDuplicate} className="button button-secondary"><Copy size={15} />Duplikat Eksperimen</button><button onClick={exportResult} className="button button-secondary"><ArrowDownToLine size={15} />Ekspor Hasil</button></div>
    </Card>

    <div className="stat-grid">
      <StatCard label="Harga median" value={<PriceDisplay amount={experiment.median_price} />} tooltip="Harga simulasi tengah: setengah dari hasil berada di bawah nilai ini." />
      <StatCard label="Persentil ke-25" value={<PriceDisplay amount={experiment.p25} />} tooltip="25% hasil simulasi berada pada atau di bawah harga ini." />
      <StatCard label="Persentil ke-75" value={<PriceDisplay amount={experiment.p75} />} tooltip="75% hasil simulasi berada pada atau di bawah harga ini." />
      <StatCard label="Standar deviasi" value={<PriceDisplay amount={experiment.std_deviation} />} tooltip="Seberapa luas harga simulasi tersebar di sekitar rata-ratanya." tone="indigo" />
    </div>

    <div className="grid gap-5 xl:grid-cols-[1fr_1.6fr]">
      <Card><CardHeader title="Subset historis" description="Observasi yang cocok" icon={Database} /><dl className="space-y-4 px-6 pb-6 text-sm">{[
        ["Rekam data yang cocok", formatNumber(experiment.historical_sample_count)],
        ["Hari tersisa", `${experiment.days_left - experiment.days_tolerance}–${experiment.days_left + experiment.days_tolerance} hari`],
        ["Minimum historis", <PriceDisplay amount={experiment.minimum_price} key="min" inline />],
        ["Maksimum historis", <PriceDisplay amount={experiment.maximum_price} key="max" inline />],
      ].map(([label, value]) => <div key={label as string} className="flex justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><dt className="text-slate-500">{label}</dt><dd className="font-mono text-xs font-semibold text-slate-800">{value}</dd></div>)}</dl></Card>
      <Card><CardHeader title="Distribusi harga simulasi" description="Frekuensi bucket aktual dari simulasi Monte Carlo." /><div className="chart-frame px-4 pb-5" role="img" aria-label="Histogram of demo ticket price ranges in INR and simulated frequency."><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={histogram} margin={{ top: 5, right: 10, bottom: 30, left: 0 }}><CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" /><XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} label={{ value: "Rentang harga tiket (INR)", position: "bottom", offset: 14, fill: "#64748b", fontSize: 11 }} /><YAxis width={48} tickFormatter={(value: number) => formatNumber(value)} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [formatNumber(Number(value)), "Frekuensi simulasi"]} /><Bar dataKey="frequency" fill="#4f6eec" radius={[4, 4, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer></div></Card>
    </div>

    <Card className="overflow-hidden"><CardHeader title="Distribusi probabilitas" description={`Probabilitas = frekuensi bucket ÷ ${experiment.historical_sample_count} rekam data historis yang cocok.`} /><DataTable label={`${experiment.id} probability distribution`}><thead><tr><th>Rentang harga</th><th>Frekuensi Historis</th><th>Probabilitas</th><th>Prob. kumulatif</th><th>Interval acak</th></tr></thead><tbody>{buckets.map((bucket: any) => <tr key={bucket.id}><td className="font-medium"><span className="flex items-center gap-1"><PriceDisplay amount={bucket.price_min} inline /> – <PriceDisplay amount={bucket.price_max} inline /></span></td><td>{bucket.frequency}</td><td className="font-mono text-xs">{Number(bucket.probability).toFixed(4)}</td><td className="font-mono text-xs">{Number(bucket.cumulative_probability).toFixed(4)}</td><td className="font-mono text-xs text-blue-600">{fourDigits(bucket.random_min)}–{fourDigits(bucket.random_max)}</td></tr>)}</tbody></DataTable></Card>

    <Card className="overflow-hidden"><CardHeader title="Sampel angka acak" description={`Sampel dipetakan dari rentang 0000–9999; menggunakan titik tengah bucket. Menampilkan ${samples.length} item.`} /><DataTable label={`${experiment.id} random number samples`}><thead><tr><th>Iterasi</th><th>Angka acak</th><th>Rentang harga</th><th>Harga sampel</th></tr></thead><tbody>{samples.map((sample: any) => <tr key={sample.id}><td>{sample.iteration}</td><td className="font-mono text-xs text-indigo-600">{fourDigits(sample.random_number)}</td><td><span className="flex items-center gap-1"><PriceDisplay amount={sample.price_range_min} inline /> – <PriceDisplay amount={sample.price_range_max} inline /></span></td><td className="font-mono text-xs font-semibold"><PriceDisplay amount={sample.sampled_price} inline /></td></tr>)}</tbody></DataTable></Card>

    <Card>
      <CardHeader title="Evaluasi Akurasi" description="Evaluasi terhadap data historis yang disisihkan." />
      <div className="px-6 pb-6">
        {accTest ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div><dt className="text-xs text-slate-500 mb-1">MAPE</dt><dd className="font-mono text-sm font-semibold text-blue-700">{Number(accTest.mape).toFixed(2)}%</dd></div>
              <div><dt className="text-xs text-slate-500 mb-1">MAE</dt><dd className="font-mono text-sm font-semibold text-slate-800"><PriceDisplay amount={accTest.mae} /></dd></div>
              <div><dt className="text-xs text-slate-500 mb-1">RMSE</dt><dd className="font-mono text-sm font-semibold text-slate-800"><PriceDisplay amount={accTest.rmse} /></dd></div>
              <div><dt className="text-xs text-slate-500 mb-1">Cakupan 95%</dt><dd className="font-mono text-sm font-semibold text-slate-800">{accTest.interval_coverage ? `${Number(accTest.interval_coverage).toFixed(2)}%` : '-'}</dd></div>
              <div><dt className="text-xs text-slate-500 mb-1">Bias Prediksi</dt><dd className="font-mono text-sm font-semibold text-slate-800">{accTest.bias ? <PriceDisplay amount={accTest.bias} /> : '-'}</dd></div>
              <div><dt className="text-xs text-slate-500 mb-1">Interval 95%</dt><dd className="font-mono text-sm font-semibold text-slate-800">{accTest.interval_95_low ? <span className="flex items-center gap-1"><PriceDisplay amount={accTest.interval_95_low} inline /> – <PriceDisplay amount={accTest.interval_95_high} inline /></span> : '-'}</dd></div>
              <div><dt className="text-xs text-slate-500 mb-1">Sampel Evaluasi</dt><dd className="font-mono text-sm font-semibold text-slate-800">{formatNumber(accTest.test_samples)}</dd></div>
              <div><dt className="text-xs text-slate-500 mb-1">Dibuat Pada</dt><dd className="text-sm font-semibold text-slate-800">{new Date(accTest.created_at).toLocaleDateString("id-ID")}</dd></div>
            </dl>
            <div className="flex items-center gap-3">
              <Link href={`/accuracy/${accTest.id}`} className="button button-primary">Lihat Evaluasi Lengkap</Link>
              <Link href={`/accuracy?simulationId=${experiment.id}`} className="button button-secondary">Jalankan Evaluasi Baru</Link>
              {experiment.accuracy_tests && experiment.accuracy_tests.length > 1 && <span className="text-xs text-slate-500 ml-auto">{experiment.accuracy_tests.length} evaluasi tersimpan</span>}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            <p className="text-sm text-slate-500 mb-4">Belum dievaluasi</p>
            <Link href={`/accuracy?simulationId=${experiment.id}`} className="button button-primary">Evaluasi Akurasi</Link>
          </div>
        )}
      </div>
    </Card>
  </section>;
}
