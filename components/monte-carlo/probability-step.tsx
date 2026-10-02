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
      <CardHeader title="Historical Frequency & Probability" description={`Each price bucket receives a share of the 10,000 possible random numbers.`} icon={TableProperties} action={<Badge tone="blue">Stage 02</Badge>} />
      <DataTable label="Historical probability distribution">
        <thead><tr><th>Price Range</th><th className="text-right">Frequency</th><th className="text-right"><abbr title="Frequency divided by the total number of observations">Probability</abbr></th><th className="text-right"><abbr title="Total probability up to and including this price range">Cumulative Probability</abbr></th><th className="text-right">Random Interval</th></tr></thead>
        <tbody>{result.buckets.map((row, index) => <tr key={index}>
          <td className="font-medium">₹{row.min.toLocaleString('en-IN')}–₹{row.max.toLocaleString('en-IN')}</td><td className="text-right font-mono">{row.frequency}</td><td className="text-right font-mono">{row.probability.toFixed(4)}</td><td className="text-right font-mono font-semibold text-blue-600">{row.cumulativeProbability.toFixed(4)}</td><td className="text-right"><span className="whitespace-nowrap rounded bg-indigo-50 px-2 py-1 font-mono text-xs text-indigo-700">{String(row.intervalStart).padStart(4, '0')}–{String(row.intervalEnd).padStart(4, '0')}</span></td>
        </tr>)}</tbody>
        <tfoot><tr className="bg-slate-50 font-semibold"><td>Total sample</td><td className="text-right font-mono">{formatNumber(result.historicalSampleCount)}</td><td className="text-right font-mono">1.0000</td><td className="text-right">—</td><td className="text-right font-mono">10,000 values</td></tr></tfoot>
      </DataTable>
      <div className="table-footer"><span className="font-mono text-blue-700">P(x) = f(x) / Σf</span><span>Intervals use rounded cumulative boundaries; every number maps to one bucket.</span></div>
    </Card>
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="p-5 [&>.card-header]:px-0 [&>.card-header]:pt-0"><CardHeader title="Historical Price Distribution" description={`Frequency · ${formatNumber(result.historicalSampleCount)} actual observations`} icon={ChartColumn} /><HistoricalHistogram result={result} /></Card>
      <Card className="p-5 [&>.card-header]:px-0 [&>.card-header]:pt-0"><CardHeader title="Cumulative Probability" description="Probability of falling in this price range or below" icon={ChartNoAxesCombined} /><CumulativeProbabilityChart result={result} /></Card>
    </div>
  </div>;
}
