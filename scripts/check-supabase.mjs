import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually to avoid needing dotenv package
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].trim();
    }
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ Missing Supabase URL or Key in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function checkConnection() {
  console.log("Testing Supabase connection...");
  
  // Try to fetch a single row from flight_prices to check if the schema is available
  const { data, error } = await supabase
    .from('flight_prices')
    .select('id')
    .limit(1);

  if (error) {
    console.error("❌ Supabase connection failed or table does not exist:");
    console.error("   Message:", error.message);
    console.error("\nMake sure you have run the initial schema migration (supabase/migrations/001_initial_schema.sql) in your Supabase SQL Editor.");
    process.exit(1);
  }

  console.log("✅ Successfully connected to Supabase!");
  console.log("✅ The 'flight_prices' table exists in the database.");
  
  if (data && data.length > 0) {
    console.log("✅ The 'flight_prices' table contains data.");
  } else {
    console.log("ℹ️ The 'flight_prices' table is currently empty.");
  }
}

checkConnection();
