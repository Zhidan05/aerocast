import { evaluateAccuracy } from '../lib/accuracy/evaluation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function evaluateScenario(
  sourceCity: string, destinationCity: string, flightClass: string, daysLeft: number, tolerance: number
) {
  const minDays = Math.max(0, daysLeft - tolerance);
  const maxDays = daysLeft + tolerance;

  const { data, error } = await supabase
    .from('flight_prices')
    .select('id, price, days_left, airline')
    .eq('source_city', sourceCity)
    .eq('destination_city', destinationCity)
    .eq('class', flightClass)
    .gte('days_left', minDays)
    .lte('days_left', maxDays);

  if (error) {
    console.error("Error fetching data:", error);
    return;
  }

  if (data.length < 50) {
    console.log(`[${sourceCity} -> ${destinationCity} | ${flightClass}] Insufficient data: ${data.length} records`);
    return;
  }

  const result = evaluateAccuracy({
    sourceCity,
    destinationCity,
    flightClass,
    daysLeft,
    tolerance,
    calibrationRatio: 0.8,
    iterations: 10000,
    splitSeed: 2026,
    monteCarloSeed: 123456
  }, data);

  console.log(`\n=== SCENARIO: ${sourceCity} -> ${destinationCity} | ${flightClass} ===`);
  console.log(`Total subset: ${result.split.totalCount}`);
  console.log(`Calibration samples: ${result.split.calibrationCount}`);
  console.log(`Evaluation samples: ${result.split.evaluationCount}`);
  
  console.log(`\n-- Monte Carlo Expected --`);
  console.log(`Expected Price: ₹${Math.round(result.monteCarlo.expectedPrice)}`);
  console.log(`Median: ₹${Math.round(result.monteCarlo.median)}`);
  console.log(`95% Interval: ₹${Math.round(result.monteCarlo.p2_5)} - ₹${Math.round(result.monteCarlo.p97_5)}`);
  
  console.log(`\n-- Metrics --`);
  console.log(`MAE: ₹${result.metrics.mae.toFixed(2)}`);
  console.log(`MAPE: ${result.metrics.mape.toFixed(2)}%`);
  console.log(`RMSE: ₹${result.metrics.rmse.toFixed(2)}`);
  console.log(`Bias: ₹${result.metrics.bias.toFixed(2)}`);
  console.log(`95% Coverage: ${result.metrics.intervalCoverage.toFixed(2)}%`);
  console.log(`Interval Width: ₹${Math.round(result.metrics.intervalWidth)}`);
  console.log(`Inside: ${result.metrics.insideIntervalCount} | Outside: ${result.metrics.outsideIntervalCount}`);
}

async function main() {
  await evaluateScenario('Delhi', 'Mumbai', 'Economy', 7, 1);
  await evaluateScenario('Mumbai', 'Delhi', 'Economy', 7, 1);
  await evaluateScenario('Delhi', 'Mumbai', 'Business', 7, 1);
  await evaluateScenario('Bangalore', 'Delhi', 'Economy', 7, 1);
}

main().catch(console.error);
