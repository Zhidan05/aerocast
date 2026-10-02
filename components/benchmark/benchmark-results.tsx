"use client";

import { Card, CardHeader } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { ChartNoAxesCombined, CheckCircle2 } from 'lucide-react';
import type { BenchmarkResult } from '@/lib/benchmarking/benchmark';
import { formatPrice } from '@/lib/format';
import { Badge } from '@/components/ui/badge';

import { PriceDisplay } from '@/components/ui/price-display';

export function BenchmarkResults({ result }: { result: BenchmarkResult }) {
  const formatMetric = (val: number | null, isPercent = false) => {
    if (val === null || isNaN(val)) return 'N/A';
    return isPercent ? `${val.toFixed(2)}%` : val.toFixed(2);
  };

  const PriceCell = ({ val }: { val: number | null }) => {
    if (val === null || isNaN(val)) return <span>N/A</span>;
    return <PriceDisplay amount={val} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <CheckCircle2 size={16} />
          <span>Evaluation Complete: <strong>{result.dataSplit.evaluationCount}</strong> test observations</span>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Calibration: {result.dataSplit.calibrationCount} rows
        </div>
      </div>

      <Card>
        <CardHeader 
          title="Baseline Comparison" 
          description="Direct comparison of prediction metrics across methodologies. Lower error (MAE, MAPE, RMSE) is better."
          icon={ChartNoAxesCombined} 
        />
        <DataTable label="Benchmark Results">
          <thead>
            <tr>
              <th>Method</th>
              <th>Expected Price</th>
              <th>MAE</th>
              <th>MAPE</th>
              <th>RMSE</th>
              <th>Bias</th>
              <th>Coverage</th>
              <th>Interval Width</th>
            </tr>
          </thead>
          <tbody>
            {result.baselines.map((baseline) => (
              <tr key={baseline.method}>
                <td className="font-semibold text-slate-700">{baseline.method}</td>
                <td className="font-mono text-blue-700 font-medium"><PriceDisplay amount={baseline.expectedPrice} /></td>
                <td className="font-mono text-slate-600"><PriceCell val={baseline.metrics.mae} /></td>
                <td className="font-mono text-slate-600">{formatMetric(baseline.metrics.mape, true)}</td>
                <td className="font-mono text-slate-600"><PriceCell val={baseline.metrics.rmse} /></td>
                <td className="font-mono text-slate-600"><PriceCell val={baseline.metrics.bias} /></td>
                <td className="font-mono text-slate-600">{formatMetric(baseline.metrics.intervalCoverage, true)}</td>
                <td className="font-mono text-slate-600"><PriceCell val={baseline.metrics.intervalWidth} /></td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        <div className="table-footer flex justify-between">
          <span>* Bias = Expected - Actual</span>
          <span>N/A indicates metric is not applicable for deterministic baselines.</span>
        </div>
      </Card>
      
      {/* Metric comparison bars could be added here */}
    </div>
  );
}
