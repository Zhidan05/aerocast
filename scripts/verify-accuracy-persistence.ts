import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAccuracyPersistence() {
  console.log("Starting Accuracy Persistence Verification...\n");
  
  const clientRunId = uuidv4();
  
  const payload = {
    simulation_id: null,
    train_ratio: 0.8,
    test_ratio: 0.2,
    train_samples: 240,
    test_samples: 60,
    mae: 1520.5,
    mape: 12.3,
    rmse: 2100.4,
    split_seed: 2026,
    monte_carlo_seed: 12345,
    bias: -50.2,
    interval_coverage: 96.6,
    interval_width: 8000,
    inside_interval_count: 58,
    outside_interval_count: 2,
    expected_price: 15000,
    interval_95_low: 11000,
    interval_95_high: 19000,
    source_city: "Delhi",
    destination_city: "Mumbai",
    class: "Economy",
    days_left: 7,
    days_tolerance: 1,
    iteration_count: 10000,
    client_run_id: clientRunId,
    error_histogram: JSON.stringify([{ min: -1000, max: 0, frequency: 10 }])
  };

  console.log("1. Saving evaluation (first attempt)...");
  const res = await supabase.from('accuracy_tests').insert(payload).select('id').single();
  if (res.error) {
    console.error("❌ Failed to save evaluation:", res.error);
    process.exit(1);
  }
  const savedId = res.data.id;
  console.log(`✅ Success. Evaluation ID: ${savedId}`);

  console.log("\n2. Querying inserted data to verify values...");
  const { data: verifyData, error: verifyError } = await supabase.from('accuracy_tests').select('*').eq('id', savedId).single();
  
  if (verifyError || !verifyData) {
    console.error("❌ Verification failed:", verifyError);
    process.exit(1);
  }
  
  if (verifyData.mape !== 12.3 || verifyData.interval_coverage !== 96.6) {
    console.error("❌ Value mismatch in saved data.");
    console.log(verifyData);
    process.exit(1);
  }
  console.log("✅ Verified successfully.");

  console.log("\n3. Testing idempotency with same client_run_id...");
  const { data: existing } = await supabase.from('accuracy_tests').select('id').eq('client_run_id', clientRunId).maybeSingle();
  if (existing && existing.id === savedId) {
    console.log(`✅ Idempotency confirmed. Found same ID: ${existing.id}`);
  } else {
    console.error("❌ Idempotency failed. Did not find expected ID.");
    process.exit(1);
  }

  console.log("\n4. Testing Accuracy Summary RPC...");
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_accuracy_summary');
  if (rpcError) {
    console.error("❌ RPC failed:", rpcError);
    process.exit(1);
  }
  console.log("✅ RPC get_accuracy_summary returned data:", rpcData);

  console.log("\n5. Cleaning up test data...");
  const { error: delError } = await supabase.from('accuracy_tests').delete().eq('id', savedId);
  if (delError) {
    console.error("❌ Failed to clean up:", delError);
  } else {
    console.log("✅ Cleanup complete.");
  }

  console.log("\nVerification completed successfully.");
}

verifyAccuracyPersistence().catch(console.error);
