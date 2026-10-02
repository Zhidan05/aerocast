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
    <CardHeader title="Perbandingan eksperimen" description="Periksa estimasi harga, dispersi, dan metrik evaluasi secara berdampingan." icon={GitCompareArrows} action={<button className="button button-ghost" aria-label="Close experiment comparison" onClick={onClose}><X size={18} /></button>} />
    {experiments.length < 2 ? <div className="px-6 pb-8 text-sm text-slate-500">Pilih setidaknya dua eksperimen pada tabel di atas untuk membandingkan hasilnya.</div> : <>
      <DataTable label="Perbandingan hasil eksperimen">
        <thead><tr><th>Eksperimen / rute</th><th>Iterasi</th><th>Rata-rata</th><th>Median</th><th><abbr title="Standar deviasi: sebaran dari harga yang disimulasikan">Standar Deviasi</abbr></th><th><abbr title="Rata-rata kesalahan persentase absolut (MAPE)">MAPE</abbr></th></tr></thead>
        <tbody>{experiments.map((experiment) => {
          const accTest = experiment.accuracy_tests && experiment.accuracy_tests[0];
          return <tr key={experiment.id}><td><span className="font-mono text-xs font-semibold text-blue-600">{experiment.id.split('-')[0]}</span><div className="mt-1 font-medium">{experiment.source_city} → {experiment.destination_city}</div><div className="mt-1 text-xs text-slate-500">{experiment.class === "Business" ? "Bisnis" : "Ekonomi"} · {experiment.days_left} hari ± {experiment.days_tolerance}</div></td><td className="font-mono text-xs">{formatNumber(experiment.iteration_count)}</td><td className="font-mono text-xs font-semibold"><PriceDisplay amount={experiment.mean_price} /></td><td className="font-mono text-xs"><PriceDisplay amount={experiment.median_price} /></td><td className="font-mono text-xs"><PriceDisplay amount={experiment.std_deviation} /></td><td className="font-mono text-xs">{accTest ? `${Number(accTest.mape).toFixed(1)}%` : '-'}</td></tr>
        })}</tbody>
      </DataTable>
      <div className="p-5 sm:p-6">
        <h3 className="mb-1 text-sm font-semibold">{convergence ? "Estimasi rata-rata berdasarkan jumlah iterasi" : "Estimasi harga berdasarkan eksperimen"}</h3>
        <p className="mb-5 text-xs leading-relaxed text-slate-500">{convergence ? `${first.source_city} → ${first.destination_city} · ${first.class === "Business" ? "Bisnis" : "Ekonomi"} · ${first.days_left} hari sebelum keberangkatan. Jarak horizontal yang sama mewakili masing-masing jumlah iterasi yang dipilih.` : "Parameter rute yang berbeda atau jumlah iterasi yang berulang ditampilkan sebagai eksperimen yang terpisah."}</p>
        <div className="chart-frame" role="img" aria-label={convergence ? "Grafik garis estimasi harga rata-rata dalam INR terhadap jumlah iterasi; nilai eksak pada tabel di atas." : "Grafik batang estimasi harga rata-rata dalam INR per eksperimen; nilai eksak pada tabel di atas."}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            {convergence ? <LineChart data={chartData} margin={{ top: 12, right: 15, bottom: 28, left: 10 }}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "Jumlah iterasi", position: "bottom", offset: 10, fill: "#64748b", fontSize: 11 }} /><YAxis width={62} domain={["dataMin - 200", "dataMax + 200"]} tickFormatter={(value: number) => `₹${(value / 1000).toFixed(1)}k`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value: any) => formatTooltipValue(Number(value), "Estimasi rata-rata")} labelFormatter={(label) => `${label} iterasi`} /><Line type="linear" dataKey="price" stroke="#2563eb" strokeWidth={3} dot={{ r: 5, fill: "#fff", strokeWidth: 3 }} activeDot={{ r: 7 }} isAnimationActive={false} /></LineChart> : <BarChart data={chartData} margin={{ top: 12, right: 15, bottom: 28, left: 10 }}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "Eksperimen", position: "bottom", offset: 10, fill: "#64748b", fontSize: 11 }} /><YAxis width={62} tickFormatter={(value: number) => `₹${value / 1000}k`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value: any) => formatTooltipValue(Number(value), "Estimasi harga")} /><Bar dataKey="price" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={100} isAnimationActive={false} /></BarChart>}
          </ResponsiveContainer>
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-indigo-50 px-4 py-3 text-xs leading-relaxed text-indigo-700"><Info size={15} className="mt-0.5 shrink-0" />{convergence ? "Lebih banyak iterasi dapat menstabilkan estimasi, namun tidak menghilangkan bias dari data historis. Grafik ini mengilustrasikan konvergensi menggunakan hasil aktual." : "Bandingkan rute, kelas, hari tersisa, dan toleransi yang sama pada jumlah iterasi yang berbeda untuk melihat konvergensi. Semua hasil yang ditampilkan adalah data aktual."}</p>
      </div>
    </>}
  </Card>;
}
