import { createClient } from '@supabase/supabase-js';

async function auditAerocastIntegrity() {
  console.log('--- AEROCAST DATA INTEGRITY AUDIT ---\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  let hasFails = false;
  const pass = (msg: string) => console.log(`[PASS] ${msg}`);
  const warn = (msg: string) => console.log(`[WARN] ${msg}`);
  const fail = (msg: string) => {
    console.log(`[FAIL] ${msg}`);
    hasFails = true;
  };

  // 1. Fetch data
  const { data: simulations, error: simError } = await supabase.from('simulations').select('*');
  const { data: buckets, error: bucketError } = await supabase.from('simulation_buckets').select('*');
  const { data: accuracies, error: accError } = await supabase.from('accuracy_tests').select('*');

  if (simError || bucketError || accError) {
    console.error('Error fetching data for audit.');
    process.exit(1);
  }

  const simMap = new Map((simulations || []).map(s => [s.id, s]));
  
  // 2. Duplicate client_run_id
  const clientRunIds = new Set();
  let duplicateClientRunIds = 0;
  for (const s of simulations || []) {
    if (s.client_run_id) {
      if (clientRunIds.has(s.client_run_id)) duplicateClientRunIds++;
      else clientRunIds.add(s.client_run_id);
    }
  }
  if (duplicateClientRunIds > 0) fail(`${duplicateClientRunIds} duplicate client_run_id found in simulations.`);
  else pass('No duplicate client_run_ids found.');

  // 3. Orphan buckets
  let orphanBuckets = 0;
  let invalidProbabilities = 0;
  let invalidCumulative = 0;
  let cumulativeNot1 = 0;
  let invalidSimFreq = 0;
  const bucketSums = new Map<string, { prob: number, simFreq: number, lastCum: number }>();

  for (const b of buckets || []) {
    if (!simMap.has(b.simulation_id)) orphanBuckets++;
    if (b.probability < 0 || b.probability > 1) invalidProbabilities++;
    if (b.cumulative_probability < 0 || b.cumulative_probability > 1) invalidCumulative++;
    
    const cur = bucketSums.get(b.simulation_id) || { prob: 0, simFreq: 0, lastCum: 0 };
    cur.prob += b.probability;
    cur.simFreq += b.simulated_frequency;
    if (b.cumulative_probability > cur.lastCum) cur.lastCum = b.cumulative_probability;
    bucketSums.set(b.simulation_id, cur);
  }

  if (orphanBuckets > 0) fail(`${orphanBuckets} orphan simulation_buckets found.`);
  else pass('No orphan buckets.');
  
  if (invalidProbabilities > 0) fail(`${invalidProbabilities} buckets have invalid probabilities.`);
  else pass('Bucket probabilities within [0, 1].');
  
  // check sums
  for (const [simId, sums] of bucketSums.entries()) {
    const sim = simMap.get(simId);
    if (!sim) continue;
    if (sums.simFreq !== sim.iteration_count) invalidSimFreq++;
    if (Math.abs(sums.lastCum - 1) > 1e-6) cumulativeNot1++;
  }
  
  if (invalidSimFreq > 0) fail(`${invalidSimFreq} simulations have SUM(simulated_frequency) != iteration_count.`);
  else pass('Simulation frequency totals match iterations.');
  
  if (cumulativeNot1 > 0) fail(`${cumulativeNot1} simulations have final cumulative_probability != 1.`);
  else pass('Bucket cumulative probabilities end at 1.');

  // 4. Linked Accuracy Mismatch & Metrics
  let linkedMismatches = 0;
  let orphanAccuracies = 0;
  let invalidMetrics = 0;

  for (const acc of accuracies || []) {
    // Check NaN/Infinity in metrics
    if (isNaN(acc.mae) || !isFinite(acc.mae) || 
        isNaN(acc.rmse) || !isFinite(acc.rmse) || 
        isNaN(acc.bias) || !isFinite(acc.bias)) {
      invalidMetrics++;
    }

    if (acc.simulation_id) {
      const parent = simMap.get(acc.simulation_id);
      if (!parent) {
        orphanAccuracies++;
      } else {
        const mismatch = 
          acc.source_city !== parent.source_city ||
          acc.destination_city !== parent.destination_city ||
          acc.class !== parent.class ||
          acc.days_left !== parent.days_left ||
          acc.days_tolerance !== parent.days_tolerance ||
          acc.iteration_count !== parent.iteration_count ||
          acc.monte_carlo_seed !== parent.seed;

        if (mismatch) linkedMismatches++;
      }
    }
  }

  if (orphanAccuracies > 0) warn(`${orphanAccuracies} accuracy evaluations linked to non-existent simulation_id.`);
  else pass('No orphan accuracy evaluations.');

  if (linkedMismatches > 0) fail(`${linkedMismatches} linked accuracy evaluations have mismatched parameters with parent simulation.`);
  else pass('Linked accuracy parameters correctly mirror parent simulations.');

  if (invalidMetrics > 0) fail(`${invalidMetrics} accuracy tests have NaN or Infinity metric values.`);
  else pass('All accuracy tests have finite numeric metrics.');

  // 5. Experiment without accuracy
  const simIdsWithAcc = new Set((accuracies || []).filter(a => a.simulation_id).map(a => a.simulation_id));
  const simWithoutAcc = (simulations || []).length - simIdsWithAcc.size;
  warn(`${simWithoutAcc} experiments do not have a linked accuracy test.`);

  console.log('\n--- AUDIT SUMMARY ---');
  if (hasFails) {
    console.error('Data integrity issues found. Some checks FAILED.');
    process.exit(1);
  } else {
    console.log('✅ ALL AUDIT CHECKS PASSED.');
  }
}

auditAerocastIntegrity().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
