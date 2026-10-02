"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import { AccuracyObservation, AccuracyHistogramBin } from "@/lib/accuracy/types";
import { useCurrency } from "@/components/currency-provider";
import { formatPrice } from "@/lib/format";

const axis = { fontSize: 10, fill: "#64748b" };
const shortMoney = (value: number) => `₹${value / 1000}k`;

export function AccuracyCharts({ 
  observations, 
  histogram 
}: { 
  observations: AccuracyObservation[];
  histogram: AccuracyHistogramBin[];
}) {
  const { rate, formatIDR } = useCurrency();
  const formatTooltipValue = (value: number, name: string) => {
    if (!rate) return [formatPrice(value), name];
    return [`${formatPrice(value)} (≈ ${formatIDR(value)})`, name];
  };

  const actualVsPredicted = observations.map(o => ({ actual: o.actualPrice, predicted: o.predictedPrice }));
  
  return <section className="grid min-w-0 gap-5 xl:grid-cols-2" aria-label="Illustrative prediction evaluation charts">
    <Card className="min-w-0 p-5 sm:p-6">
      <CardHeader title="Harga Aktual vs Estimasi" description="Estimasi harga Monte Carlo vs observasi yang ditahan" />
      <div className="mt-4 flex flex-wrap gap-5 text-xs text-slate-500"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-blue-500" /> Observasi</span><span className="flex items-center gap-2"><span className="w-5 border-t border-dashed border-indigo-500" /> Prediksi ideal (y = x)</span></div>
      <div className="mt-5 h-[310px] min-w-0" role="img" aria-label="Actual versus expected fare scatter plot in INR.">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 480, height: 310 }}>
          <ScatterChart margin={{ top: 10, right: 12, bottom: 28, left: 10 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 4" />
            <XAxis type="number" dataKey="actual" name="Harga aktual" tick={axis} axisLine={false} tickLine={false} tickFormatter={shortMoney} label={{ value: "Harga aktual (INR)", position: "insideBottom", offset: -20, ...axis }} />
            <YAxis type="number" dataKey="predicted" name="Estimasi harga" tick={axis} axisLine={false} tickLine={false} width={45} tickFormatter={shortMoney} label={{ value: "Estimasi harga (INR)", angle: -90, position: "insideLeft", offset: -5, ...axis }} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value: any, name: any) => formatTooltipValue(Number(value), name)} contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0", fontSize: 12 }} />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 42000, y: 42000 }]} stroke="#6366f1" strokeDasharray="5 4" strokeWidth={1.5} />
            <Scatter name="Observasi" data={actualVsPredicted} fill="#4f83ff" fillOpacity={0.8} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">Estimasi harga adalah perkiraan tingkat distribusi yang dibagikan di seluruh observasi yang ditahan dengan kondisi penerbangan yang sama. Menampilkan maks 100 observasi.</p>
    </Card>
    <Card className="min-w-0 p-5 sm:p-6">
      <CardHeader title="Distribusi Kesalahan Prediksi" description="Kesalahan = Harga aktual − Estimasi harga" />
      <div className="mt-4 flex flex-wrap gap-5 text-xs text-slate-500"><span className="flex items-center gap-2"><span className="size-2 rounded-sm bg-blue-500" /> Frekuensi evaluasi</span><span className="flex items-center gap-2"><span className="h-3 border-l border-dashed border-slate-500" /> Kesalahan nol</span></div>
      <div className="mt-5 h-[310px] min-w-0" role="img" aria-label="Illustrative prediction error histogram.">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 480, height: 310 }}>
          <BarChart data={histogram} margin={{ top: 10, right: 10, bottom: 28, left: 10 }} barCategoryGap="12%">
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 4" vertical={false} />
            <XAxis dataKey="min" tick={axis} axisLine={false} tickLine={false} interval={2} tickFormatter={shortMoney} label={{ value: "Kesalahan prediksi (INR)", position: "insideBottom", offset: -20, ...axis }} />
            <YAxis tick={axis} axisLine={false} tickLine={false} width={40} label={{ value: "Frekuensi", angle: -90, position: "insideLeft", offset: -4, ...axis }} />
            <Tooltip labelFormatter={(value, payload) => payload?.[0]?.payload?.range || value} formatter={(value) => [Number(value).toLocaleString("id-ID"), "Sampel"]} contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0", fontSize: 12 }} cursor={{ fill: "#f8fafc" }} />
            <ReferenceLine x={0} stroke="#64748b" strokeDasharray="4 3" />
            <Bar dataKey="frequency" radius={[3, 3, 0, 0]} isAnimationActive={false}>{histogram.map((row, i) => <Cell key={i} fill={Math.abs(row.min) <= 2000 ? "#2563eb" : "#b4c6ff"} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">Nilai negatif: aktual lebih murah dari estimasi; nilai positif: aktual lebih mahal dari estimasi.</p>
    </Card>
  </section>;
}

