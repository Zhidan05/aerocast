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
          <span>Evaluasi Selesai: <strong>{result.dataSplit.evaluationCount}</strong> observasi pengujian</span>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Kalibrasi: {result.dataSplit.calibrationCount} baris
        </div>
      </div>

      <Card>
        <CardHeader 
          title="Perbandingan Baseline" 
          description="Perbandingan langsung dari metrik prediksi di seluruh metodologi. Kesalahan yang lebih rendah (MAE, MAPE, RMSE) lebih baik."
          icon={ChartNoAxesCombined} 
        />
        <DataTable label="Hasil Benchmark">
          <thead>
            <tr>
              <th>Metode</th>
              <th>Estimasi Harga</th>
              <th>MAE</th>
              <th>MAPE</th>
              <th>RMSE</th>
              <th>Bias</th>
              <th>Cakupan</th>
              <th>Lebar Interval</th>
            </tr>
          </thead>
          <tbody>
            {result.baselines.map((baseline: any) => (
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
          <span>* Bias = Estimasi - Aktual</span>
          <span>N/A menunjukkan metrik tidak berlaku untuk baseline deterministik.</span>
        </div>
      </Card>
      
      {/* Metric comparison bars could be added here */}
    </div>
  );
}
