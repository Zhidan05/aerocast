import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { MonteCarloResult } from '@/lib/monte-carlo';

function normalizeProbability(value: number) {
  if (!Number.isFinite(value)) {
    throw new Error("Invalid probability");
  }
  const epsilon = 1e-12;
  if (value < -epsilon || value > 1 + epsilon) {
    throw new Error("Probability outside valid range");
  }
  return Math.min(1, Math.max(0, value));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = body as MonteCarloResult;

    if (!result || !result.parameters || !result.statistics || !result.buckets) {
      return NextResponse.json({ error: 'Malformed payload' }, { status: 400 });
    }

    if (result.iterations < 100 || result.iterations > 100000) {
      return NextResponse.json({ error: 'Invalid iteration count' }, { status: 400 });
    }

    if (result.historicalSampleCount < 30) {
      return NextResponse.json({ error: 'Insufficient historical samples' }, { status: 400 });
    }

    // Bucket validations
    let previousCumulative = 0;
    let sumProbability = 0;
    let previousIntervalEnd = -1;
    let sumFrequency = 0;
    let sumSimulatedFrequency = 0;

    for (let i = 0; i < result.buckets.length; i++) {
      const b = result.buckets[i];
      const normProb = normalizeProbability(b.probability);
      const normCumProb = normalizeProbability(b.cumulativeProbability);

      if (normCumProb < previousCumulative) {
        return NextResponse.json({ error: 'Cumulative probability is not monotonic' }, { status: 400 });
      }
      
      if (i === 0 && b.intervalStart !== 0) {
        return NextResponse.json({ error: 'First interval must start at 0' }, { status: 400 });
      }
      
      if (i === result.buckets.length - 1 && b.intervalEnd !== 9999) {
        return NextResponse.json({ error: 'Last interval must end at 9999' }, { status: 400 });
      }
      
      if (i > 0 && b.intervalStart !== previousIntervalEnd + 1) {
        return NextResponse.json({ error: 'Random interval gap or overlap detected' }, { status: 400 });
      }

      previousCumulative = normCumProb;
      sumProbability += normProb;
      previousIntervalEnd = b.intervalEnd;
      sumFrequency += b.frequency;
      
      const simFreq = typeof b.simulatedFrequency === 'number' ? b.simulatedFrequency : Math.round(b.probability * result.iterations);
      sumSimulatedFrequency += simFreq;
    }

    if (Math.abs(sumProbability - 1) > 1e-9) {
      return NextResponse.json({ error: 'Sum of probabilities must be approximately 1' }, { status: 400 });
    }
    
    if (sumFrequency !== result.historicalSampleCount) {
      return NextResponse.json({ error: 'Sum of frequency does not match historicalSampleCount' }, { status: 400 });
    }

    if (sumSimulatedFrequency !== result.iterations) {
      return NextResponse.json({ error: `Simulation histogram is inconsistent with iteration count. Expected ${result.iterations}, Received ${sumSimulatedFrequency}` }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Format for save_monte_carlo_experiment RPC
    const simulationPayload = {
      client_run_id: result.clientRunId, // Optional idempotency key
      source_city: result.parameters.sourceCity,
      destination_city: result.parameters.destinationCity,
      class: result.parameters.flightClass,
      days_left: result.parameters.daysLeft,
      days_tolerance: result.parameters.tolerance,
      iteration_count: result.iterations,
      historical_sample_count: result.historicalSampleCount,
      seed: result.seed,
      mean_price: result.statistics.mean,
      median_price: result.statistics.median,
      p25: result.statistics.percentiles.p25,
      p75: result.statistics.percentiles.p75,
      minimum_price: result.statistics.min,
      maximum_price: result.statistics.max,
      std_deviation: result.statistics.stdDev,
      interval_95_low: result.statistics.percentiles.p2_5,
      interval_95_high: result.statistics.percentiles.p97_5,
    };

    const bucketsPayload = result.buckets.map((b, i) => ({
      bucket_order: i + 1,
      price_min: b.min,
      price_max: b.max,
      frequency: b.frequency,
      probability: normalizeProbability(b.probability),
      cumulative_probability: normalizeProbability(b.cumulativeProbability),
      random_min: b.intervalStart,
      random_max: b.intervalEnd,
      simulated_frequency: typeof b.simulatedFrequency === 'number' ? b.simulatedFrequency : Math.round(b.probability * result.iterations)
    }));

    const samplesPayload = (result.randomSamples || []).slice(0, 50).map(s => ({
      iteration: s.iteration,
      random_number: s.randomNumber,
      price_range_min: s.bucketMin,
      price_range_max: s.bucketMax,
      sampled_price: s.sampledPrice
    }));

    const { data: simulationId, error } = await supabase.rpc('save_monte_carlo_experiment', {
      p_simulation: simulationPayload,
      p_buckets: bucketsPayload,
      p_samples: samplesPayload
    });

    if (error) {
      console.error('RPC Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: simulationId });
  } catch (error: any) {
    console.error('Experiment Save Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
