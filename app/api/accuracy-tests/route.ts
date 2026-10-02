import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AccuracyEvaluationResult } from '@/lib/accuracy/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = body.result as AccuracyEvaluationResult;
    const simulationId = body.simulationId as string | undefined;
    const clientRunId = body.clientRunId as string | undefined;

    if (!result || !result.parameters || !result.metrics || !result.split) {
      return NextResponse.json({ error: 'Malformed payload' }, { status: 400 });
    }

    const m = result.metrics;
    
    if (
      !Number.isFinite(m.mae) || m.mae < 0 ||
      !Number.isFinite(m.mape) || m.mape < 0 ||
      !Number.isFinite(m.rmse) || m.rmse < 0
    ) {
      return NextResponse.json({ error: 'Invalid metrics' }, { status: 400 });
    }

    if (m.intervalCoverage < 0 || m.intervalCoverage > 100) {
      return NextResponse.json({ error: 'Invalid coverage' }, { status: 400 });
    }

    if (result.monteCarlo.interval95[0] > result.monteCarlo.interval95[1]) {
      return NextResponse.json({ error: 'Invalid interval' }, { status: 400 });
    }

    if (m.insideIntervalCount + m.outsideIntervalCount !== result.split.evaluationCount) {
      return NextResponse.json({ error: 'Sample count mismatch' }, { status: 400 });
    }

    const p = result.parameters;

    if (p.sourceCity === p.destinationCity) {
      return NextResponse.json({ error: 'Source and destination must differ' }, { status: 400 });
    }

    if (p.iterations < 1000 || p.iterations > 100000) {
      return NextResponse.json({ error: 'Invalid iterations' }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (simulationId) {
      const { data: simulation, error: simError } = await supabase
        .from('simulations')
        .select('*')
        .eq('id', simulationId)
        .single();

      if (simError || !simulation) {
        return NextResponse.json({ error: 'Linked experiment could not be found' }, { status: 404 });
      }

      if (
        p.sourceCity !== simulation.source_city ||
        p.destinationCity !== simulation.destination_city ||
        p.flightClass !== simulation.class ||
        p.daysLeft !== simulation.days_left ||
        p.tolerance !== simulation.days_tolerance ||
        p.iterations !== simulation.iteration_count ||
        (simulation.seed !== null && p.monteCarloSeed !== simulation.seed)
      ) {
        return NextResponse.json({ error: 'Linked evaluation parameters do not match the saved experiment.' }, { status: 400 });
      }
    }

    const payload = {
      simulation_id: simulationId || null,
      train_ratio: p.calibrationRatio,
      test_ratio: 1 - p.calibrationRatio,
      train_samples: result.split.calibrationCount,
      test_samples: result.split.evaluationCount,
      mae: m.mae,
      mape: m.mape,
      rmse: m.rmse,
      split_seed: p.splitSeed,
      monte_carlo_seed: p.monteCarloSeed,
      bias: m.bias,
      interval_coverage: m.intervalCoverage,
      interval_width: m.intervalWidth,
      inside_interval_count: m.insideIntervalCount,
      outside_interval_count: m.outsideIntervalCount,
      expected_price: result.monteCarlo.expectedPrice,
      interval_95_low: result.monteCarlo.interval95[0],
      interval_95_high: result.monteCarlo.interval95[1],
      source_city: p.sourceCity,
      destination_city: p.destinationCity,
      class: p.flightClass,
      days_left: p.daysLeft,
      days_tolerance: p.tolerance,
      iteration_count: p.iterations,
      client_run_id: clientRunId || null,
      error_histogram: result.errorHistogram ? JSON.stringify(result.errorHistogram) : null
    };

    if (clientRunId) {
      const { data: existing } = await supabase
        .from('accuracy_tests')
        .select('id')
        .eq('client_run_id', clientRunId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ id: existing.id });
      }
    }

    const { data: saved, error } = await supabase
      .from('accuracy_tests')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.error('Save error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: saved.id });

  } catch (err: any) {
    console.error('Accuracy save error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
