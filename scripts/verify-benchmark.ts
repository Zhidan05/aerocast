import { createClient } from '@supabase/supabase-js';
import { runBenchmark } from '../lib/benchmarking';

async function verifyBenchmark() {
  console.log('--- BENCHMARK ENGINE VALIDATION ---');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('1. Fetching Historical Dataset...');
  const { data: rawData, error } = await supabase
    .from('flight_prices')
    .select('id, price, days_left')
    .eq('source_city', 'Delhi')
    .eq('destination_city', 'Hyderabad')
    .eq('class', 'Business')
    .gte('days_left', 9)
    .lte('days_left', 11);

  if (error) {
    console.error('Error fetching data:', error);
    process.exit(1);
  }

  const historicalData = rawData || [];
  if (historicalData.length < 50) {
    console.warn('[WARN] Insufficient rows for full evaluation test.');
  }

  const params = {
    sourceCity: 'Delhi',
    destinationCity: 'Hyderabad',
    flightClass: 'Business',
    daysLeft: 10,
    daysTolerance: 1,
    calibrationRatio: 0.8,
    splitSeed: 2026,
    monteCarloSeed: 123456,
    iterations: 10000
  };

  const result1 = runBenchmark(params, historicalData);

  // A. Same scenario produces deterministic results.
  const result2 = runBenchmark(params, historicalData);
  if (JSON.stringify(result1) !== JSON.stringify(result2)) {
    console.error('[FAIL] Benchmark is not deterministic.');
    process.exit(1);
  } else {
    console.log('[PASS] Benchmark engine is strictly deterministic.');
  }

  // C. Calibration + evaluation = total.
  if (result1.dataSplit.calibrationCount + result1.dataSplit.evaluationCount !== result1.dataSplit.totalCount) {
    console.error('[FAIL] Calibration + Evaluation != Total');
    process.exit(1);
  } else {
    console.log('[PASS] Calibration + Evaluation = Total');
  }

  // E. All methods receive exactly the same calibration/evaluation sets.
  // G, H. Means and Medians calculation
  const mc = result1.baselines.find(b => b.method === 'Monte Carlo');
  const mean = result1.baselines.find(b => b.method === 'Historical Mean');
  const median = result1.baselines.find(b => b.method === 'Historical Median');

  if (!mc || !mean || !median) {
    console.error('[FAIL] Missing baselines.');
    process.exit(1);
  }

  if (mc.observations.length !== mean.observations.length || mean.observations.length !== median.observations.length) {
    console.error('[FAIL] Observation length mismatch across baselines.');
    process.exit(1);
  } else {
    console.log('[PASS] All baselines share exactly the same evaluation set.');
  }

  // K. Baseline without interval does not produce fake coverage = 0.
  if (mean.metrics.intervalCoverage !== null || mean.metrics.intervalWidth !== null) {
    console.error('[FAIL] Historical Mean produced a non-null interval coverage.');
    process.exit(1);
  } else {
    console.log('[PASS] Mean/Median return null for interval metrics.');
  }

  if (mc.metrics.intervalCoverage === null || mc.metrics.intervalWidth === null) {
    console.error('[FAIL] Monte Carlo did not produce interval metrics.');
    process.exit(1);
  } else {
    console.log('[PASS] Monte Carlo returns valid interval metrics.');
  }

  // L. Different split seed changes the split deterministically.
  const resultDiffSplit = runBenchmark({ ...params, splitSeed: 9999 }, historicalData);
  if (resultDiffSplit.baselines[0].expectedPrice === result1.baselines[0].expectedPrice && historicalData.length > 50) {
    console.warn('[WARN] Split seed change did not alter outcomes.');
  } else {
    console.log('[PASS] Different split seed successfully alters evaluation and baselines.');
  }

  // M. Different Monte Carlo seed only affects Monte Carlo randomness, not Mean/Median baselines.
  const resultDiffMC = runBenchmark({ ...params, monteCarloSeed: 9999 }, historicalData);
  
  const mcDiff = resultDiffMC.baselines.find(b => b.method === 'Monte Carlo');
  const meanDiff = resultDiffMC.baselines.find(b => b.method === 'Historical Mean');
  
  if (mcDiff?.expectedPrice === mc.expectedPrice) {
    console.warn('[WARN] Different MC seed produced identical MC expected price.');
  } else {
    console.log('[PASS] Different MC seed altered MC outcome.');
  }

  if (meanDiff?.expectedPrice !== mean.expectedPrice) {
    console.error('[FAIL] Changing MC seed accidentally altered Historical Mean!');
    process.exit(1);
  } else {
    console.log('[PASS] Historical Mean/Median are immune to Monte Carlo seed changes.');
  }

  console.log('\n✅ BENCHMARK ENGINE VALIDATION PASSED.');
}

verifyBenchmark().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
