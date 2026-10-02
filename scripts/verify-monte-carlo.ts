import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { runMonteCarlo } from '../lib/monte-carlo/index';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const envVars = Object.fromEntries(envFile.split('\n').map(line => line.split('=')));

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL']?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY']?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('Fetching historical dataset for QA (Delhi to Mumbai, Economy, 7 days left, tolerance 1)...');
  
  const { data, error } = await supabase
    .from('flight_prices')
    .select('price')
    .eq('source_city', 'Delhi')
    .eq('destination_city', 'Mumbai')
    .eq('class', 'Economy')
    .gte('days_left', 6)
    .lte('days_left', 8);

  if (error) {
    console.error('Error fetching data:', error);
    process.exit(1);
  }

  const historicalPrices = data.map(d => d.price);
  console.log(`Historical sample count: ${historicalPrices.length}`);

  if (historicalPrices.length < 30) {
    console.error('Not enough data to run QA. Ensure data is imported.');
    process.exit(1);
  }

  const params = {
    sourceCity: 'Delhi',
    destinationCity: 'Mumbai',
    flightClass: 'Economy',
    daysLeft: 7,
    tolerance: 1,
    iterations: 10000,
    seed: 12345
  };

  console.log('Running 10,000 iterations...');
  const start = performance.now();
  const result1 = runMonteCarlo(params, historicalPrices);
  console.log(`10k iterations took: ${(performance.now() - start).toFixed(2)}ms`);

  console.log('\n--- QA Verification ---');
  console.log(`Bucket count: ${result1.bucketCount}`);
  console.log(`Seed used: ${result1.seed}`);
  console.log(`Mean: ${result1.statistics.mean.toFixed(2)}`);
  console.log(`Median: ${result1.statistics.median.toFixed(2)}`);
  
  // Validation Rules
  const totalFreq = result1.buckets.reduce((a, b) => a + b.frequency, 0);
  if (totalFreq !== historicalPrices.length) throw new Error(`Freq mismatch: ${totalFreq} vs ${historicalPrices.length}`);

  let sumProb = 0;
  let prevCum = -1;
  let prevEnd = -1;

  for (let i = 0; i < result1.buckets.length; i++) {
    const b = result1.buckets[i];
    
    if (!Number.isFinite(b.probability) || !Number.isFinite(b.cumulativeProbability)) {
      throw new Error(`NaN/Infinity detected in bucket ${i}`);
    }
    
    if (b.probability < 0 || b.probability > 1) throw new Error(`Prob out of bounds: ${b.probability}`);
    if (b.cumulativeProbability < 0 || b.cumulativeProbability > 1) throw new Error(`CumProb out of bounds: ${b.cumulativeProbability}`);
    if (b.cumulativeProbability < prevCum) throw new Error(`CumProb is not monotonic`);
    
    if (i === 0 && b.intervalStart !== 0) throw new Error(`First interval start not 0`);
    if (i === result1.buckets.length - 1 && b.intervalEnd !== 9999) throw new Error(`Last interval end not 9999`);
    if (i > 0 && b.intervalStart !== prevEnd + 1) throw new Error(`Gap or overlap in interval detected`);
    
    sumProb += b.probability;
    prevCum = b.cumulativeProbability;
    prevEnd = b.intervalEnd;
    
    if (i === result1.buckets.length - 1) {
      if (b.cumulativeProbability !== 1) {
        throw new Error(`Final cumulative probability is strictly not 1. Found: ${b.cumulativeProbability}`);
      }
    }
  }

  if (Math.abs(sumProb - 1) > 1e-9) throw new Error(`Prob sum mismatch: ${sumProb}`);

  // Reproducibility
  const result2 = runMonteCarlo(params, historicalPrices);
  if (result1.statistics.mean !== result2.statistics.mean) throw new Error('Reproducibility failed!');

  // Different seed varies
  const result3 = runMonteCarlo({ ...params, seed: 99999 }, historicalPrices);
  if (result1.statistics.mean === result3.statistics.mean) throw new Error('Different seed produced identical mean!');

  // Test 10: Simulated frequency per bucket sum equals iterations
  const sumSimFreq10k = result1.buckets.reduce((acc, b) => acc + (b.simulatedFrequency || 0), 0);
  if (sumSimFreq10k !== params.iterations) {
    throw new Error(`Simulated frequency sum mismatch! Expected ${params.iterations}, Got ${sumSimFreq10k}`);
  }
  const sumHistFreq10k = result1.histogram.reduce((acc, h) => acc + h.frequency, 0);
  if (sumHistFreq10k !== params.iterations) {
    throw new Error(`Histogram frequency sum mismatch! Expected ${params.iterations}, Got ${sumHistFreq10k}`);
  }

  // Regression check for 100, 1k, 100k
  const testIterations = [100, 1000, 100000];
  for (const iter of testIterations) {
    const res = runMonteCarlo({ ...params, iterations: iter }, historicalPrices);
    const sf = res.buckets.reduce((acc, b) => acc + (b.simulatedFrequency || 0), 0);
    const hf = res.histogram.reduce((acc, h) => acc + h.frequency, 0);
    if (sf !== iter) throw new Error(`Simulated frequency sum mismatch for ${iter} iterations! Got ${sf}`);
    if (hf !== iter) throw new Error(`Histogram frequency sum mismatch for ${iter} iterations! Got ${hf}`);
  }

  console.log('\n✅ All automated checks passed!');
}

verify().catch(console.error);
