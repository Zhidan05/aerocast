import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runAudit() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: tests, error } = await supabase
    .from('accuracy_tests')
    .select(`
      id, simulation_id, source_city, destination_city, class, days_left, days_tolerance, iteration_count, monte_carlo_seed,
      simulations ( id, source_city, destination_city, class, days_left, days_tolerance, iteration_count, seed )
    `)
    .not('simulation_id', 'is', null);

  if (error) {
    console.error(error);
    return;
  }

  const inconsistent = tests.filter((t: any) => {
    const s = t.simulations;
    if (!s) return true;
    return (
      t.source_city !== s.source_city ||
      t.destination_city !== s.destination_city ||
      t.class !== s.class ||
      t.days_left !== s.days_left ||
      t.days_tolerance !== s.days_tolerance ||
      t.iteration_count !== s.iteration_count ||
      (s.seed !== null && t.monte_carlo_seed !== s.seed)
    );
  });

  console.log(`Found ${inconsistent.length} inconsistent rows out of ${tests.length} total linked tests.`);
  
  if (inconsistent.length > 0) {
    console.log("Example inconsistent row:");
    const eg = inconsistent[0] as any;
    console.log("Accuracy Test:");
    console.log(`Route: ${eg.source_city} -> ${eg.destination_city}`);
    console.log(`Class: ${eg.class}`);
    console.log(`Days: ${eg.days_left} (±${eg.days_tolerance})`);
    console.log(`Iterations: ${eg.iteration_count}`);
    console.log(`Seed: ${eg.monte_carlo_seed}`);
    
    const s = eg.simulations as any;
    console.log("Simulation:");
    console.log(`Route: ${s.source_city} -> ${s.destination_city}`);
    console.log(`Class: ${s.class}`);
    console.log(`Days: ${s.days_left} (±${s.days_tolerance})`);
    console.log(`Iterations: ${s.iteration_count}`);
    console.log(`Seed: ${s.seed}`);
  }
}

runAudit();
