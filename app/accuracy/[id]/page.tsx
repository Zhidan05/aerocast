import { getAccuracyTestById } from "@/lib/repositories/accuracy-tests";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { AccuracyCharts } from "@/components/accuracy/accuracy-charts";
import { formatNumber } from "@/lib/format";
import { PriceDisplay } from "@/components/ui/price-display";
import Link from "next/link";
import { ArrowLeft, Target, Percent, Gauge, Layers3, ArrowRight, ArrowDownToLine, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { DeleteEvaluationButton } from "./delete-button";

export default async function AccuracyDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const evaluation = await getAccuracyTestById(params.id).catch(() => null);

  if (!evaluation) {
    return notFound();
  }

  return (
    <div className="page-stack">
      <PageHeader 
        eyebrow="EVALUATION SNAPSHOT" 
        title={`Accuracy Test`} 
        description={`Saved on ${new Date(evaluation.created_at).toLocaleString()}`} 
        actions={
          <div className="flex gap-2">
            {evaluation.simulation_id && (
              <Link href={`/experiments/${evaluation.simulation_id}`} className="button button-primary">
                View Linked Experiment
              </Link>
            )}
            <DeleteEvaluationButton id={evaluation.id} />
          </div>
        }
      />

      <Card className="p-5 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50/40">
        <div className="flex flex-col gap-4">
          <div><span className="text-xs font-semibold tracking-wider text-blue-700 uppercase">Route & Parameters</span>
            <p className="my-2 text-xl font-semibold text-blue-800 flex items-center gap-2">
              {evaluation.source_city} <ArrowRight size={16} /> {evaluation.destination_city}
            </p>
            <p className="text-sm text-slate-600">
              <Badge tone="blue">{evaluation.class}</Badge> &middot; {evaluation.days_left} days left &middot; ±{evaluation.days_tolerance} tolerance &middot; {formatNumber(evaluation.iteration_count)} runs
            </p>
          </div>
        </div>
      </Card>

      <div className="stat-grid">
        <StatCard label="MAE" value={<PriceDisplay amount={evaluation.mae} />} helper="Mean absolute price error" icon={Target} />
        <StatCard label="MAPE" value={`${Number(evaluation.mape).toFixed(2)}%`} helper="Primary evaluation metric" icon={Percent} tone="indigo" highlight />
        <StatCard label="RMSE" value={<PriceDisplay amount={evaluation.rmse} />} helper="Emphasizes larger errors" icon={Gauge} />
        <StatCard label="95% Coverage" value={evaluation.interval_coverage ? `${Number(evaluation.interval_coverage).toFixed(2)}%` : '-'} helper={`${evaluation.inside_interval_count} inside interval`} icon={Layers3} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50">
        <div><span className="block text-xs text-slate-500 mb-1">Expected Price</span><span className="font-mono font-semibold text-slate-800"><PriceDisplay amount={evaluation.expected_price} /></span></div>
        <div><span className="block text-xs text-slate-500 mb-1">Bias / Mean Error</span><span className="font-mono font-semibold text-slate-800"><PriceDisplay amount={evaluation.bias} /></span></div>
        <div><span className="block text-xs text-slate-500 mb-1">95% Interval</span><span className="font-mono font-semibold text-slate-800 flex items-center gap-1"><PriceDisplay amount={evaluation.interval_95_low} inline /> – <PriceDisplay amount={evaluation.interval_95_high} inline /></span></div>
        <div><span className="block text-xs text-slate-500 mb-1">95% Interval Width</span><span className="font-mono font-semibold text-slate-800"><PriceDisplay amount={evaluation.interval_width} /></span></div>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="min-w-0 lg:w-[40%]"><CardHeader title="Data Partitioning" description="Calibration and evaluation data samples." icon={Layers3} /></div>
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs"><span className="flex items-center gap-2 font-medium text-blue-700"><span className="size-2 rounded-full bg-blue-600" /> Calibration {Math.round(evaluation.train_ratio * 100)}% <span className="font-mono text-slate-500">{formatNumber(evaluation.train_samples)}</span></span><span className="flex items-center gap-2 font-medium text-indigo-600"><span className="size-2 rounded-full bg-indigo-500" /> Evaluation {Math.round(evaluation.test_ratio * 100)}% <span className="font-mono text-slate-500">{formatNumber(evaluation.test_samples)}</span></span></div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="bg-blue-600" style={{ width: `${evaluation.train_ratio * 100}%` }} /><div className="bg-indigo-500" style={{ width: `${evaluation.test_ratio * 100}%` }} /></div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>Seeds: {evaluation.split_seed} (split), {evaluation.monte_carlo_seed} (MC)</span></div>
          </div>
        </div>
      </Card>

      {evaluation.error_histogram && (
        <AccuracyCharts observations={[]} histogram={evaluation.error_histogram as any} />
      )}
    </div>
  );
}
