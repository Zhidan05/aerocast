"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/ui/price-display";
import { useCurrency } from "@/components/currency-provider";
import { formatPrice } from "@/lib/format";

const axis = { fontSize: 11, fill: "#64748b" };

export interface ChartData {
  avgPriceDays: { days_left: number; average_price: number }[];
  avgPriceAirline: { airline: string; average_price: number }[];
  classSummary: { class: string; average_price: number; total_records: number }[];
}

export function DatasetCharts({ data }: { data: ChartData }) {
  const { rate, formatIDR } = useCurrency();
  const priceByDays = data.avgPriceDays.map((d) => ({ days: d.days_left, price: Math.round(d.average_price) }));
  const priceByAirline = data.avgPriceAirline.map((d) => ({ airline: d.airline, price: Math.round(d.average_price) }));

  const formatTooltipValue = (value: number, name: string) => {
    if (!rate) return [formatPrice(value), name];
    return [`${formatPrice(value)} (≈ ${formatIDR(value)})`, name];
  };
  
  const classSummary = data.classSummary || [];
  const classComparison = classSummary.map((d) => {
    const total = classSummary.reduce((acc, cur) => acc + Number(cur.total_records), 0);
    const shareRaw = total > 0 ? (Number(d.total_records) / total) * 100 : 0;
    return {
      name: d.class,
      price: Math.round(d.average_price),
      records: Number(d.total_records),
      share: `${shareRaw.toFixed(1)}%`,
      color: d.class === "Business" ? "#2563eb" : "#a5a0f5"
    };
  });

  return (
    <section className="grid min-w-0 gap-5 xl:grid-cols-[1.45fr_1fr]" aria-label="Illustrative dataset distributions">
      <Card className="min-w-0 p-5 sm:p-6">
        <CardHeader title="Average Price by Days Left" description="How the departure window relates to ticket fares" action={<Badge>Real trend</Badge>} />
        <div className="mt-6 h-[340px] min-w-0" role="img" aria-label="Average fare variations based on days left to departure.">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 340 }}>
            <AreaChart data={priceByDays} margin={{ top: 14, right: 8, bottom: 25, left: 2 }}>
              <defs><linearGradient id="days-price-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="days" tick={axis} axisLine={false} tickLine={false} minTickGap={18} label={{ value: "Days before departure", position: "insideBottom", offset: -20, ...axis }} />
              <YAxis tick={axis} axisLine={false} tickLine={false} width={48} tickFormatter={(value) => `₹${value / 1000}k`} />
              <Tooltip formatter={(value: any) => formatTooltipValue(Number(value), "Average price")} labelFormatter={(value) => `${value} ${Number(value) === 1 ? "day" : "days"} before departure`} contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0", fontSize: 12 }} />
              <Area type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2.5} fill="url(#days-price-gradient)" dot={{ r: 3, fill: "white", strokeWidth: 2 }} activeDot={{ r: 5 }} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">Real reference averages across classes computed from the database.</p>
      </Card>
      <div className="grid min-w-0 gap-5">
        <Card className="min-w-0 p-5">
          <CardHeader title="Average Price by Airline" description="Reference average fare across both classes" />
          <div className="mt-4 h-[190px] min-w-0" role="img" aria-label="Average price comparison across airlines.">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 400, height: 190 }}>
              <BarChart data={priceByAirline} layout="vertical" margin={{ top: 0, right: 25, bottom: 0, left: 0 }} barSize={10}>
                <XAxis type="number" tick={axis} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                <YAxis type="category" dataKey="airline" width={65} tick={{ ...axis, fill: "#334155" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: any) => formatTooltipValue(Number(value), "Average price")} cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="price" radius={[0, 6, 6, 0]} isAnimationActive={false}>{priceByAirline.map((row, index) => <Cell key={row.airline} fill={index < 2 ? "#2563eb" : "#a5a0f5"} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <CardHeader title="Economy vs Business" description="Class mix and average price" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {classComparison.map((item: { name: string; price: number; records: number; share: string; color: string; }) => <div key={item.name} className={`min-w-0 rounded-xl p-3 ${item.name === "Business" ? "bg-blue-50" : "bg-indigo-50"}`}>
              <div className="flex flex-wrap items-center justify-between gap-1 text-xs"><span className="font-medium text-slate-700">{item.name}</span><span className="text-slate-500">{item.share}</span></div>
              <p className={`mt-2 font-mono text-lg font-semibold sm:text-xl ${item.name === "Business" ? "text-blue-700" : "text-slate-900"}`}><PriceDisplay amount={item.price} /></p>
              <div className="mt-3 h-1.5 rounded-full bg-white"><div className="h-full rounded-full" style={{ width: item.share, background: item.color }} /></div>
              <p className="mt-2 text-[11px] text-slate-500">{item.records.toLocaleString("en-US")} records</p>
            </div>)}
          </div>
        </Card>
      </div>
    </section>
  );
}
