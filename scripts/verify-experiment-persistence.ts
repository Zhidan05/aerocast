import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { runMonteCarlo } from "../lib/monte-carlo/index";

const envFile = fs.readFileSync('.env.local', 'utf-8');
const envVars = Object.fromEntries(envFile.split('\n').map(line => line.split('=')));

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL']?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY']?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE URL or SERVICE KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runVerification() {
  console.log("Starting Experiment Persistence Verification...\n");

  const { data, error } = await supabase
    .from('flight_prices')
    .select('price')
    .eq('source_city', 'Delhi')
    .eq('destination_city', 'Mumbai')
    .eq('class', 'Business')
    .gte('days_left', 19)
    .lte('days_left', 21);

  if (error || !data) {
    console.error('Error fetching data:', error);
    process.exit(1);
  }

  const historicalPrices = data.map(d => d.price);
  
  const params = {
    sourceCity: 'Delhi',
    destinationCity: 'Mumbai',
    flightClass: 'Business',
    daysLeft: 20,
    tolerance: 1,
    iterations: 100000,
    seed: 128678
  };

  const mcResult = runMonteCarlo(params, historicalPrices);
  mcResult.clientRunId = uuidv4();
  
  console.log(`Historical sample count: ${mcResult.historicalSampleCount}`);
  console.log(`Bucket count: ${mcResult.buckets.length}`);
  
  for (let i = 0; i < mcResult.buckets.length; i++) {
    const b = mcResult.buckets[i];
    console.log(`Bucket ${i+1}: Freq=${b.frequency}, Prob=${b.probability}, CumProb=${b.cumulativeProbability}, Random=${b.intervalStart}-${b.intervalEnd}`);
  }
  
  // Create payload logic identical to POST /api/experiments
  const simulationPayload = {
    client_run_id: mcResult.clientRunId,
    source_city: mcResult.parameters.sourceCity,
    destination_city: mcResult.parameters.destinationCity,
    class: mcResult.parameters.flightClass,
    days_left: mcResult.parameters.daysLeft,
    days_tolerance: mcResult.parameters.tolerance,
    iteration_count: mcResult.iterations,
    historical_sample_count: mcResult.historicalSampleCount,
    seed: mcResult.seed,
    mean_price: mcResult.statistics.mean,
    median_price: mcResult.statistics.median,
    p25: mcResult.statistics.percentiles.p25,
    p75: mcResult.statistics.percentiles.p75,
    minimum_price: mcResult.statistics.min,
    maximum_price: mcResult.statistics.max,
    std_deviation: mcResult.statistics.stdDev,
    interval_95_low: mcResult.statistics.percentiles.p2_5,
    interval_95_high: mcResult.statistics.percentiles.p97_5,
  };

  const bucketsPayload = mcResult.buckets.map((b, i) => ({
    bucket_order: i + 1,
    price_min: b.min,
    price_max: b.max,
    frequency: b.frequency,
    probability: Math.min(1, Math.max(0, b.probability)),
    cumulative_probability: Math.min(1, Math.max(0, b.cumulativeProbability)),
    random_min: b.intervalStart,
    random_max: b.intervalEnd,
    simulated_frequency: mcResult.histogram && mcResult.histogram[i] ? mcResult.histogram[i].frequency : Math.round(b.probability * mcResult.iterations)
  }));

  const currentSum = bucketsPayload.reduce((sum, b) => sum + b.simulated_frequency, 0);
  if (currentSum !== mcResult.iterations && bucketsPayload.length > 0) {
    bucketsPayload[bucketsPayload.length - 1].simulated_frequency += (mcResult.iterations - currentSum);
  }

  const samplesPayload = (mcResult.randomSamples || []).slice(0, 50).map(s => ({
    iteration: s.iteration,
    random_number: s.randomNumber,
    price_range_min: s.bucketMin,
    price_range_max: s.bucketMax,
    sampled_price: s.sampledPrice
  }));

  console.log("\n1. Saving experiment (first attempt)...");
  const { data: id1, error: err1 } = await supabase.rpc("save_monte_carlo_experiment", {
    p_simulation: simulationPayload,
    p_buckets: bucketsPayload,
    p_samples: samplesPayload,
  });

  if (err1) {
    console.error("Error saving experiment:", err1);
    process.exit(1);
  }
  console.log(`✅ Success. Simulation ID: ${id1}\n`);

  console.log("2. Saving experiment again with SAME client_run_id (testing idempotency)...");
  const { data: id2, error: err2 } = await supabase.rpc("save_monte_carlo_experiment", {
    p_simulation: simulationPayload,
    p_buckets: bucketsPayload,
    p_samples: samplesPayload,
  });

  if (err2) {
    console.error("Error testing idempotency:", err2);
    process.exit(1);
  }
  
  if (id1 === id2) {
    console.log(`✅ Idempotency confirmed. Returned same Simulation ID: ${id2}\n`);
  } else {
    console.error(`❌ Idempotency failed! First ID: ${id1}, Second ID: ${id2}`);
    process.exit(1);
  }

  console.log("3. Querying inserted data to verify constraints...");
  
  const { data: simData, error: simErr } = await supabase
    .from("simulations")
    .select("*, simulation_buckets(*), simulation_samples(*)")
    .eq("id", id1)
    .single();

  if (simErr || !simData) {
    console.error("Error querying saved simulation:", simErr);
    process.exit(1);
  }

  const sumFreq = simData.simulation_buckets.reduce((acc: number, b: { frequency: number }) => acc + b.frequency, 0);
  if (sumFreq !== simData.historical_sample_count) throw new Error("Sum of frequency does not match historical_sample_count");

  const sumSimFreq = simData.simulation_buckets.reduce((acc: number, b: { simulated_frequency: number }) => acc + b.simulated_frequency, 0);
  if (sumSimFreq !== simData.iteration_count) throw new Error("Sum of simulated_frequency does not match iteration_count");

  const maxCumProb = Math.max(...simData.simulation_buckets.map((b: { cumulative_probability: number }) => b.cumulative_probability));
  if (maxCumProb !== 1) throw new Error("Max cumulative probability is not 1");

  console.log("✅ Constraints verified successfully.");

  console.log("\n4. Cleaning up test data...");
  const { error: delErr } = await supabase.from("simulations").delete().eq("id", id1);
  if (delErr) {
    console.error("Error deleting test data:", delErr);
  } else {
    console.log("✅ Cleanup complete.");
  }
}

runVerification().catch(console.error);
