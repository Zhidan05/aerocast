"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { priceHistogram } from "@/lib/mock-data/dashboard";

export function PriceDistribution({ detailed = false }: { detailed?: boolean }) {
  return <div aria-label="Illustrative histogram of 10,000 ticket prices; expected price ₹9,850 and median ₹9,620.">
    <div className="mb-4 flex flex-wrap justify-end gap-x-4 gap-y-2 text-[10px] text-slate-500">
      <span className="flex items-center gap-1.5"><i className="h-0.5 w-3 bg-blue-600" />Expected ₹9,850</span>
      <span className="flex items-center gap-1.5"><i className="h-0.5 w-3 bg-indigo-500" />Median ₹9,620</span>
      {detailed && <><span>P25 ₹8,100</span><span>P75 ₹11,200</span></>}
    </div>
    <div className="chart-frame">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 300 }}>
        <BarChart data={priceHistogram} margin={{ top: 15, right: 12, left: 5, bottom: 24 }} barCategoryGap="14%" accessibilityLayer>
          <CartesianGrid stroke="#e8edf5" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="price" type="number" domain={[4500,19500]} ticks={[5000,7500,10000,12500,15000,17500]} tickFormatter={value => `₹${value / 1000}k`} tick={{ fill: "#8390a6", fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: "Ticket Price (INR)", position: "bottom", offset: 7, fill: "#8390a6", fontSize: 10 }} />
          <YAxis width={46} tick={{ fill: "#8390a6", fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: "Frequency", angle: -90, position: "insideLeft", fill: "#8390a6", fontSize: 10 }} />
          <Tooltip cursor={{ fill: "#eff4ff" }} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11 }} labelFormatter={label => `Price bucket: ₹${Number(label).toLocaleString("en-US")}`} />
          <Bar dataKey="frequency" name="Simulated observations" fill="#6896f8" radius={[3,3,0,0]} isAnimationActive={false} />
          <ReferenceLine x={9850} stroke="#2563eb" strokeWidth={2} />
          <ReferenceLine x={9620} stroke="#6366f1" strokeDasharray="4 3" />
          {detailed && <><ReferenceLine x={8100} stroke="#94a3b8" strokeDasharray="3 3" /><ReferenceLine x={11200} stroke="#94a3b8" strokeDasharray="3 3" /></>}
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>;
}
