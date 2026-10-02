"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonteCarloResult } from "@/lib/monte-carlo";
import { useCurrency } from "@/components/currency-provider";
import { formatPrice } from "@/lib/format";

const axisStyle = { fontSize: 11, fill: "#64748b" };
const tooltipStyle = { border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12 };

export function HistoricalHistogram({ result }: { result: MonteCarloResult }) {
  const { rate, formatIDR } = useCurrency();
  const formatRange = (min: number, max: number) => {
    if (!rate) return `${formatPrice(min)}–${formatPrice(max)}`;
    return `${formatPrice(min)}–${formatPrice(max)} (≈ ${formatIDR(min)}–${formatIDR(max)})`;
  };

  const data = result.buckets.map(b => ({
    label: formatRange(b.min, b.max),
    shortLabel: `${Math.round(b.min/1000)}k–${Math.round(b.max/1000)}k`,
    frequency: b.frequency
  }));

  return <div className="h-64 min-w-0" role="img" aria-label="Historical frequency histogram">
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <BarChart data={data} margin={{ top: 12, right: 10, left: 0, bottom: 25 }}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
        <XAxis dataKey="shortLabel" tick={axisStyle} axisLine={false} tickLine={false} label={{ value: "Ticket price (₹)", position: "bottom", offset: 7, style: axisStyle }} />
        <YAxis width={38} tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }} />
        <Bar dataKey="frequency" name="Historical records" radius={[5, 5, 0, 0]} maxBarSize={60} isAnimationActive={false}>
          {data.map((row, index) => <Cell key={row.label} fill={index === Math.floor(data.length / 2) ? "#2563eb" : "#c7d2fe"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>;
}

export function CumulativeProbabilityChart({ result }: { result: MonteCarloResult }) {
  const { rate, formatIDR } = useCurrency();
  const formatRange = (min: number, max: number) => {
    if (!rate) return `${formatPrice(min)}–${formatPrice(max)}`;
    return `${formatPrice(min)}–${formatPrice(max)} (≈ ${formatIDR(min)}–${formatIDR(max)})`;
  };

  const data = result.buckets.map(b => ({
    label: formatRange(b.min, b.max),
    shortLabel: `${Math.round(b.min/1000)}k–${Math.round(b.max/1000)}k`,
    cumulative: b.cumulativeProbability
  }));

  return <div className="h-64 min-w-0" role="img" aria-label="Cumulative probability">
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <LineChart data={data} margin={{ top: 12, right: 14, left: 0, bottom: 25 }}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
        <XAxis dataKey="shortLabel" tick={axisStyle} axisLine={false} tickLine={false} label={{ value: "Ticket price (₹)", position: "bottom", offset: 7, style: axisStyle }} />
        <YAxis domain={[0, 1]} width={42} tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(value: number) => `${Math.round(value * 100)}%`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${(Number(value) * 100).toFixed(2)}%`, "Cumulative probability"]} />
        <Line type="stepAfter" dataKey="cumulative" name="Cumulative probability" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4, fill: "#ffffff", strokeWidth: 2 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>;
}

export function SimulatedPriceDistribution({ result }: { result: MonteCarloResult }) {
  const { rate, formatIDR } = useCurrency();
  const formatRange = (min: number, max: number) => {
    if (!rate) return `${formatPrice(min)}–${formatPrice(max)}`;
    return `${formatPrice(min)}–${formatPrice(max)} (≈ ${formatIDR(min)}–${formatIDR(max)})`;
  };

  const data = result.histogram.map(b => ({
    label: formatRange(b.min, b.max),
    shortLabel: `${Math.round(b.min/1000)}k–${Math.round(b.max/1000)}k`,
    frequency: b.frequency
  }));

  return <div className="h-64 min-w-0" role="img" aria-label="Simulated distribution histogram">
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <BarChart data={data} margin={{ top: 12, right: 10, left: 0, bottom: 25 }}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
        <XAxis dataKey="shortLabel" tick={axisStyle} axisLine={false} tickLine={false} label={{ value: "Ticket price (₹)", position: "bottom", offset: 7, style: axisStyle }} />
        <YAxis width={45} tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }} />
        <Bar dataKey="frequency" name="Simulated prices" radius={[5, 5, 0, 0]} maxBarSize={60} isAnimationActive={false}>
          {data.map((row, index) => <Cell key={row.label} fill={"#3b82f6"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>;
}
