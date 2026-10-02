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
      <CardHeader title="Actual vs Expected Price" description="Monte Carlo expected price vs held-out observations" />
      <div className="mt-4 flex flex-wrap gap-5 text-xs text-slate-500"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-blue-500" /> Observation</span><span className="flex items-center gap-2"><span className="w-5 border-t border-dashed border-indigo-500" /> Ideal prediction (y = x)</span></div>
      <div className="mt-5 h-[310px] min-w-0" role="img" aria-label="Actual versus expected fare scatter plot in INR.">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 480, height: 310 }}>
          <ScatterChart margin={{ top: 10, right: 12, bottom: 28, left: 10 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 4" />
            <XAxis type="number" dataKey="actual" name="Actual price" tick={axis} axisLine={false} tickLine={false} tickFormatter={shortMoney} label={{ value: "Actual price (INR)", position: "insideBottom", offset: -20, ...axis }} />
            <YAxis type="number" dataKey="predicted" name="Expected price" tick={axis} axisLine={false} tickLine={false} width={45} tickFormatter={shortMoney} label={{ value: "Expected price (INR)", angle: -90, position: "insideLeft", offset: -5, ...axis }} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value: any, name: any) => formatTooltipValue(Number(value), name)} contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0", fontSize: 12 }} />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 42000, y: 42000 }]} stroke="#6366f1" strokeDasharray="5 4" strokeWidth={1.5} />
            <Scatter name="Observations" data={actualVsPredicted} fill="#4f83ff" fillOpacity={0.8} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">The expected price is a distribution-level estimate shared across held-out observations with the same flight conditions. Displaying max 100 observations.</p>
    </Card>
    <Card className="min-w-0 p-5 sm:p-6">
      <CardHeader title="Prediction Error Distribution" description="Error = Actual price − Expected price" />
      <div className="mt-4 flex flex-wrap gap-5 text-xs text-slate-500"><span className="flex items-center gap-2"><span className="size-2 rounded-sm bg-blue-500" /> Evaluation frequency</span><span className="flex items-center gap-2"><span className="h-3 border-l border-dashed border-slate-500" /> Zero error</span></div>
      <div className="mt-5 h-[310px] min-w-0" role="img" aria-label="Illustrative prediction error histogram.">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 480, height: 310 }}>
          <BarChart data={histogram} margin={{ top: 10, right: 10, bottom: 28, left: 10 }} barCategoryGap="12%">
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 4" vertical={false} />
            <XAxis dataKey="min" tick={axis} axisLine={false} tickLine={false} interval={2} tickFormatter={shortMoney} label={{ value: "Prediction error (INR)", position: "insideBottom", offset: -20, ...axis }} />
            <YAxis tick={axis} axisLine={false} tickLine={false} width={40} label={{ value: "Frequency", angle: -90, position: "insideLeft", offset: -4, ...axis }} />
            <Tooltip labelFormatter={(value, payload) => payload?.[0]?.payload?.range || value} formatter={(value) => [Number(value).toLocaleString("en-US"), "Samples"]} contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0", fontSize: 12 }} cursor={{ fill: "#f8fafc" }} />
            <ReferenceLine x={0} stroke="#64748b" strokeDasharray="4 3" />
            <Bar dataKey="frequency" radius={[3, 3, 0, 0]} isAnimationActive={false}>{histogram.map((row, i) => <Cell key={i} fill={Math.abs(row.min) <= 2000 ? "#2563eb" : "#b4c6ff"} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">Negative values: actual cheaper than expected; positive values: actual more expensive than expected.</p>
    </Card>
  </section>;
}

