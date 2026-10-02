import { ChartColumn, ChartNoAxesCombined, TableProperties } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { CumulativeProbabilityChart, HistoricalHistogram } from "./workflow-charts";
import type { MonteCarloResult } from "@/lib/monte-carlo";
import { formatNumber } from "@/lib/format";

export function ProbabilityStep({ result }: { result: MonteCarloResult }) {
  return <div className="page-stack">
    <Card className="p-5 sm:p-6 [&>.card-header]:px-0 [&>.card-header]:pt-0">
      <CardHeader title="Frekuensi & Probabilitas Historis" description={`Setiap bucket harga menerima bagian dari 10.000 kemungkinan angka acak.`} icon={TableProperties} action={<Badge tone="blue">Tahap 02</Badge>} />
      <DataTable label="Distribusi probabilitas historis">
        <thead><tr><th>Rentang Harga</th><th className="text-right">Frekuensi</th><th className="text-right"><abbr title="Frekuensi dibagi dengan jumlah total observasi">Probabilitas</abbr></th><th className="text-right"><abbr title="Total probabilitas hingga dan termasuk rentang harga ini">Probabilitas Kumulatif</abbr></th><th className="text-right">Interval Acak</th></tr></thead>
        <tbody>{result.buckets.map((row, index) => <tr key={index}>
          <td className="font-medium">₹{row.min.toLocaleString('en-IN')}–₹{row.max.toLocaleString('en-IN')}</td><td className="text-right font-mono">{row.frequency}</td><td className="text-right font-mono">{row.probability.toFixed(4)}</td><td className="text-right font-mono font-semibold text-blue-600">{row.cumulativeProbability.toFixed(4)}</td><td className="text-right"><span className="whitespace-nowrap rounded bg-indigo-50 px-2 py-1 font-mono text-xs text-indigo-700">{String(row.intervalStart).padStart(4, '0')}–{String(row.intervalEnd).padStart(4, '0')}</span></td>
        </tr>)}</tbody>
        <tfoot><tr className="bg-slate-50 font-semibold"><td>Total sampel</td><td className="text-right font-mono">{formatNumber(result.historicalSampleCount)}</td><td className="text-right font-mono">1.0000</td><td className="text-right">—</td><td className="text-right font-mono">10.000 nilai</td></tr></tfoot>
      </DataTable>
      <div className="table-footer"><span className="font-mono text-blue-700">P(x) = f(x) / Σf</span><span>Interval menggunakan batas kumulatif yang dibulatkan; setiap angka dipetakan ke satu bucket.</span></div>
    </Card>
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="p-5 [&>.card-header]:px-0 [&>.card-header]:pt-0"><CardHeader title="Distribusi Harga Historis" description={`Frekuensi · ${formatNumber(result.historicalSampleCount)} observasi aktual`} icon={ChartColumn} /><HistoricalHistogram result={result} /></Card>
      <Card className="p-5 [&>.card-header]:px-0 [&>.card-header]:pt-0"><CardHeader title="Probabilitas Kumulatif" description="Probabilitas jatuh dalam rentang harga ini atau di bawahnya" icon={ChartNoAxesCombined} /><CumulativeProbabilityChart result={result} /></Card>
    </div>
  </div>;
}
