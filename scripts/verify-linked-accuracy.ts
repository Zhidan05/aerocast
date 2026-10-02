import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runVerification() {
  console.log('--- LINKED ACCURACY EVALUATION VERIFICATION ---');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // 1. Fetch a real simulation
  const { data: sims, error: simError } = await supabase
    .from('simulations')
    .select('*')
    .limit(10);
    
  if (simError || !sims || sims.length === 0) {
    console.error('Failed to fetch simulations:', simError);
    return;
  }
  
  // Try to find one that is NOT the default "Economy", 7 days, etc. if possible
  const sim = sims.find(s => s.class === 'Business' || s.days_left !== 7) || sims[0];
  
  console.log(`[1] Selected Simulation ID: ${sim.id}`);
  console.log(`    Route: ${sim.source_city} -> ${sim.destination_city}, Class: ${sim.class}`);
  console.log(`    Days: ${sim.days_left} (±${sim.days_tolerance}), Iterations: ${sim.iteration_count}, Seed: ${sim.seed}`);

  // 2. Derive config & run accuracy evaluation
  console.log('\n[2] Running evaluation via /api/accuracy with simulationId payload...');
  const evaluationPayload = {
    simulationId: sim.id,
    calibrationRatio: 0.8,
    splitSeed: 2026,
    // The rest should be ignored by the backend because simulationId is present,
    // but we'll send defaults to simulate a bad frontend state.
    sourceCity: 'FakeCity',
    destinationCity: 'FakeDest',
    flightClass: 'Economy',
    daysLeft: 1,
    tolerance: 0,
    iterations: 1000,
    monteCarloSeed: 999999
  };

  const evalRes = await fetch('http://localhost:3000/api/accuracy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evaluationPayload)
  });

  if (!evalRes.ok) {
    const err = await evalRes.text();
    console.error('Failed to run evaluation:', err);
    return;
  }

  const evalData = await evalRes.json();
  const p = evalData.parameters;
  
  // 3. Assert scenario identical
  let passed = true;
  if (p.sourceCity !== sim.source_city) passed = false;
  if (p.destinationCity !== sim.destination_city) passed = false;
  if (p.flightClass !== sim.class) passed = false;
  if (p.daysLeft !== sim.days_left) passed = false;
  if (p.tolerance !== sim.days_tolerance) passed = false;
  if (p.iterations !== sim.iteration_count) passed = false;
  if (sim.seed && p.monteCarloSeed !== sim.seed) passed = false;
  
  if (passed) {
    console.log('    ✅ Server-side enforcement SUCCESS. Returned parameters match database, ignoring bad payload.');
  } else {
    console.error('    ❌ Server-side enforcement FAILED. Returned parameters do not match database.');
    console.error('    Expected:', sim);
    console.error('    Got:', p);
    return;
  }

  // 4. Save payload validation (Good payload)
  console.log('\n[3] Testing SAVE with consistent parameters...');
  // Modify the evaluation result parameters to match the simulation so it passes
  evalData.parameters.sourceCity = sim.source_city;
  evalData.parameters.destinationCity = sim.destination_city;
  evalData.parameters.flightClass = sim.class;
  evalData.parameters.daysLeft = sim.days_left;
  evalData.parameters.tolerance = sim.days_tolerance;
  evalData.parameters.iterations = sim.iteration_count;
  evalData.parameters.monteCarloSeed = sim.seed || 123456;

  const saveRes = await fetch('http://localhost:3000/api/accuracy-tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      result: evalData,
      simulationId: sim.id,
      clientRunId: '123e4567-e89b-12d3-a456-426614174000'
    })
  });

  if (saveRes.ok) {
    console.log('    ✅ Save SUCCESS with consistent parameters.');
  } else {
    const err = await saveRes.text();
    console.error('    ❌ Save FAILED unexpectedly:', err);
  }

  // 5. Mismatch payload rejection
  console.log('\n[4] Testing SAVE with INCONSISTENT parameters...');
  evalData.parameters.flightClass = 'InvalidClass';
  
  const badSaveRes = await fetch('http://localhost:3000/api/accuracy-tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      result: evalData,
      simulationId: sim.id,
      clientRunId: '123e4567-e89b-12d3-a456-426614174001'
    })
  });

  if (!badSaveRes.ok && badSaveRes.status === 400) {
    const errData = await badSaveRes.json();
    console.log(`    ✅ Save REJECTED correctly with status 400: "${errData.error}"`);
  } else {
    console.error(`    ❌ Save was NOT rejected properly. Status: ${badSaveRes.status}`);
  }
}

runVerification();
