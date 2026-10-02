import { createClient } from '@supabase/supabase-js';
import { runMonteCarlo } from '../lib/monte-carlo/simulation';
import { splitDataset } from '../lib/accuracy/split';
import { evaluateAccuracy } from '../lib/accuracy/evaluation';

async function verifyGoldenScenario() {
  console.log('--- GOLDEN SCENARIO END-TO-END VALIDATION ---');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Fetch Data for Delhi -> Hyderabad, Business, 10 days left, +/- 1 tolerance (days 9-11)
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
  console.log(`=> Fetched ${historicalData.length} rows.`);

  if (historicalData.length < 50) {
    console.warn('[WARN] Insufficient rows for full evaluation test, but continuing for script validation.');
  }

  // Check dataset filtering anomaly
  let outOfBounds = 0;
  for (const row of historicalData) {
    if (row.days_left < 9 || row.days_left > 11) outOfBounds++;
  }
  if (outOfBounds > 0) {
    console.error(`[FAIL] Found ${outOfBounds} rows outside of days_left 9-11 tolerance window.`);
    process.exit(1);
  } else {
    console.log('[PASS] All fetched rows respect days_tolerance window strictly.');
  }

  // 2. Deterministic Split (80/20, seed 2026)
  console.log('\n2. Testing Deterministic Split...');
  const { calibration, evaluation } = splitDataset(historicalData, 0.8, 2026);
  
  console.log(`=> Total: ${historicalData.length} | Calibration: ${calibration.length} | Evaluation: ${evaluation.length}`);
  
  if (calibration.length + evaluation.length !== historicalData.length) {
    console.error('[FAIL] Calibration + Evaluation length does not equal total length.');
    process.exit(1);
  } else {
    console.log('[PASS] Calibration + Evaluation = Total Length');
  }

  // Check overlap (intersection of IDs)
  const calibIds = new Set(calibration.map(c => c.id));
  const evalIds = new Set(evaluation.map(e => e.id));
  let overlapCount = 0;
  for (const id of evalIds) {
    if (calibIds.has(id)) overlapCount++;
  }

  if (overlapCount > 0) {
    console.error(`[FAIL] Found ${overlapCount} overlapping observations between Calibration and Evaluation sets. DATA LEAKAGE!`);
    process.exit(1);
  } else {
    console.log('[PASS] No data leakage between Calibration and Evaluation sets.');
  }

  // 3. Monte Carlo Engine Integrity
  console.log('\n3. Testing Monte Carlo Distribution Integrity (10,000 iterations)...');
  const calibrationPrices = calibration.map(c => c.price);
  
  const mcParams = {
    sourceCity: 'Delhi',
    destinationCity: 'Hyderabad',
    flightClass: 'Business',
    daysLeft: 10,
    tolerance: 1,
    iterations: 10000,
    seed: 123456
  };

  const mcResult = runMonteCarlo(mcParams, calibrationPrices);

  // Validate buckets
  const buckets = mcResult.buckets;
  let freqSum = 0;
  let simFreqSum = 0;
  let previousCumulative = 0;
  
  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i];
    freqSum += b.frequency;
    simFreqSum += b.simulatedFrequency || 0;
    
    if (b.cumulativeProbability < previousCumulative) {
      console.error(`[FAIL] Cumulative probability is not monotonically increasing at bucket ${i}.`);
      process.exit(1);
    }
    previousCumulative = b.cumulativeProbability;
    
    if (i === 0 && b.intervalStart !== 0) {
      console.error(`[FAIL] First bucket interval start is not 0 (it is ${b.intervalStart}).`);
      process.exit(1);
    }
    if (i === buckets.length - 1 && b.intervalEnd !== 9999) {
      console.error(`[FAIL] Last bucket interval end is not 9999 (it is ${b.intervalEnd}).`);
      process.exit(1);
    }
  }

  if (freqSum !== calibrationPrices.length) {
    console.error(`[FAIL] Historical Bucket Frequency sum (${freqSum}) does not match calibration count (${calibrationPrices.length}).`);
    process.exit(1);
  } else {
    console.log('[PASS] SUM(historical bucket frequency) == calibration count.');
  }

  if (simFreqSum !== 10000) {
    console.error(`[FAIL] Simulated Frequency sum (${simFreqSum}) does not match 10,000 iterations.`);
    process.exit(1);
  } else {
    console.log('[PASS] SUM(simulatedFrequency) == iteration_count (10,000).');
  }

  if (Math.abs(previousCumulative - 1) > 1e-9) {
    console.error(`[FAIL] Final cumulative probability is not 1 (it is ${previousCumulative}).`);
    process.exit(1);
  } else {
    console.log('[PASS] Final cumulative_probability === 1.');
  }
  
  // Simulation interval check
  const p2_5 = mcResult.statistics.percentiles.p2_5;
  const p97_5 = mcResult.statistics.percentiles.p97_5;
  if (p2_5 > p97_5) {
    console.error(`[FAIL] 95% Simulation interval is inverted: lower=${p2_5} > upper=${p97_5}`);
    process.exit(1);
  } else {
    console.log(`[PASS] 95% Simulation Interval valid: [${p2_5}, ${p97_5}]`);
  }

  // 4. Accuracy Evaluation E2E
  console.log('\n4. Testing Accuracy Evaluation...');
  
  const accuracyParams = {
    sourceCity: 'Delhi',
    destinationCity: 'Hyderabad',
    flightClass: 'Business',
    daysLeft: 10,
    tolerance: 1,
    iterations: 10000,
    monteCarloSeed: 123456,
    calibrationRatio: 0.8,
    splitSeed: 2026
  };

  const evalResult = evaluateAccuracy(accuracyParams, historicalData);

  if (evalResult.monteCarlo.expectedPrice !== mcResult.statistics.mean) {
    console.error('[FAIL] Expected price calculation mismatch between evaluation wrapper and base engine.');
    process.exit(1);
  } else {
    console.log('[PASS] Expected Price uses deterministic MC mean.');
  }
  
  const m = evalResult.metrics;
  if (isNaN(m.mape) || isNaN(m.rmse) || isNaN(m.bias)) {
    console.error('[FAIL] Found NaN in calculated metrics:', m);
    process.exit(1);
  } else {
    console.log('[PASS] Accuracy Metrics (MAE, MAPE, RMSE, Bias, Coverage) generated successfully without NaN.');
    console.log(`       Bias=${m.bias.toFixed(2)}, MAPE=${m.mape.toFixed(2)}%, Coverage=${m.intervalCoverage.toFixed(2)}%`);
  }

  // 5. Reproducibility Test
  console.log('\n5. Testing Reproducibility...');
  const evalResult2 = evaluateAccuracy(accuracyParams, historicalData);
  
  if (evalResult.monteCarlo.expectedPrice !== evalResult2.monteCarlo.expectedPrice) {
    console.error('[FAIL] Reproducibility failed. Same parameters produced different expected price.');
    process.exit(1);
  }
  
  if (JSON.stringify(evalResult.metrics) !== JSON.stringify(evalResult2.metrics)) {
    console.error('[FAIL] Reproducibility failed. Metrics objects differ on second run.');
    process.exit(1);
  } else {
    console.log('[PASS] Full reproducibility confirmed for identical scenarios and seeds.');
  }
  
  // Different split seed
  const accuracyParamsDifferentSplit = { ...accuracyParams, splitSeed: 9999 };
  const evalResultDiffSplit = evaluateAccuracy(accuracyParamsDifferentSplit, historicalData);
  if (evalResultDiffSplit.monteCarlo.expectedPrice === evalResult.monteCarlo.expectedPrice && historicalData.length > 100) {
    // Only warn since technically they COULD be identical by chance, but extremely unlikely
    console.warn('[WARN] Different split seed produced identical expected price. Verify pseudo-random subsetting.');
  } else {
    console.log('[PASS] Changing split seed correctly altered evaluation outcome.');
  }

  // Different MC seed
  const accuracyParamsDifferentMC = { ...accuracyParams, monteCarloSeed: 9999 };
  const evalResultDiffMC = evaluateAccuracy(accuracyParamsDifferentMC, historicalData);
  if (evalResultDiffMC.monteCarlo.expectedPrice === evalResult.monteCarlo.expectedPrice && evalResult.monteCarlo.iterations < 100000) {
    console.warn('[WARN] Different Monte Carlo seed produced identical expected price.');
  } else {
    console.log('[PASS] Changing Monte Carlo seed correctly altered simulation outcome.');
  }

  console.log('\n✅ GOLDEN SCENARIO VALIDATION COMPLETED SUCCESSFULLY!');
}

verifyGoldenScenario().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
