import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local manually
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// Create admin client
const supabase = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const allowNonempty = args.includes('--allow-nonempty');

const limitArgIndex = args.indexOf('--limit');
let limit = -1;
if (limitArgIndex !== -1 && args[limitArgIndex + 1]) {
  limit = parseInt(args[limitArgIndex + 1], 10);
}

const batchSizeArgIndex = args.indexOf('--batch-size');
let batchSize = 500;
if (batchSizeArgIndex !== -1 && args[batchSizeArgIndex + 1]) {
  batchSize = parseInt(args[batchSizeArgIndex + 1], 10);
}

const datasetPath = path.resolve(process.cwd(), 'datasets', 'Clean_Dataset.csv');

async function run() {
  const startTime = Date.now();
  console.log(`Starting dataset processing: ${datasetPath}`);
  
  if (!fs.existsSync(datasetPath)) {
    console.error("❌ datasets/Clean_Dataset.csv not found in the project.");
    process.exit(1);
  }

  if (isDryRun) {
    console.log("ℹ️ Running in DRY-RUN mode. No actual inserts will be performed.");
  } else {
    // Database non-empty protection
    const { count: initialCount, error: countError } = await supabase
      .from('flight_prices')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(`❌ Error checking flight_prices count: ${countError.message}`);
      process.exit(1);
    }

    if (initialCount && initialCount > 0 && !allowNonempty) {
      console.error(`❌ flight_prices already contains ${initialCount} rows.`);
      console.error(`Use --allow-nonempty only if intentional.`);
      process.exit(1);
    }
  }

  if (limit > 0) console.log(`ℹ️ Limiting to ${limit} rows.`);
  console.log(`ℹ️ Batch size set to ${batchSize}`);
  
  const fileStream = fs.createReadStream(datasetPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let rowCount = 0;
  let skippedCount = 0;
  let headers = [];
  
  let batch = [];
  let insertedCount = 0;
  let batchNumber = 1;

  for await (const line of rl) {
    const columns = line.split(',');

    if (rowCount === 0) {
      headers = columns.map(h => h.trim());
      console.log(`📋 Found headers: ${headers.join(', ')}`);
      rowCount++;
      continue;
    }

    if (limit > 0 && rowCount > limit) {
      break;
    }

    const row = {};
    headers.forEach((h, i) => {
      row[h] = columns[i]?.trim();
    });

    try {
      const flightPrice = {
        airline: row['airline'],
        flight: row['flight'],
        source_city: row['source_city'],
        departure_time: row['departure_time'],
        stops: row['stops'],
        arrival_time: row['arrival_time'],
        destination_city: row['destination_city'],
        class: row['class'],
        duration: row['duration'] ? parseFloat(row['duration']) : null,
        days_left: parseInt(row['days_left'], 10),
        price: parseInt(row['price'], 10)
      };

      if (isNaN(flightPrice.days_left) || isNaN(flightPrice.price)) {
        throw new Error(`Invalid numeric value at row ${rowCount}`);
      }

      batch.push(flightPrice);

      if (batch.length === batchSize) {
        if (!isDryRun) {
          const { error } = await supabase.from('flight_prices').insert(batch);
          if (error) {
            console.error(`\n❌ Insert batch failed!`);
            console.error(`Batch number: ${batchNumber}`);
            console.error(`Row range: ${rowCount - batchSize + 1} to ${rowCount}`);
            console.error(`Error message: ${error.message}`);
            process.exit(1);
          }
        }
        insertedCount += batch.length;
        console.log(`Inserted ${insertedCount} rows...`);
        batch = [];
        batchNumber++;
      }

    } catch (e) {
      skippedCount++;
      if (skippedCount <= 5) {
        console.warn(`⚠️ Skipping malformed row ${rowCount}: ${e.message}`);
      }
    }

    rowCount++;
  }

  // Insert remaining
  if (batch.length > 0) {
    if (!isDryRun) {
      const { error } = await supabase.from('flight_prices').insert(batch);
      if (error) {
        console.error(`\n❌ Insert final batch failed!`);
        console.error(`Batch number: ${batchNumber}`);
        console.error(`Row range: ${rowCount - batch.length} to ${rowCount - 1}`);
        console.error(`Error message: ${error.message}`);
        process.exit(1);
      }
    }
    insertedCount += batch.length;
    if (!isDryRun) {
      console.log(`Inserted ${insertedCount} rows...`);
    }
  }

  const elapsedMs = Date.now() - startTime;
  const elapsedSec = (elapsedMs / 1000).toFixed(2);

  console.log(`\n========================================`);
  console.log(`✅ Finished processing in ${elapsedSec}s.`);
  console.log(`- Skipped/Malformed: ${skippedCount}`);

  if (isDryRun) {
    console.log("✅ Dry run completed successfully. No data was inserted.");
  } else {
    // Final verification
    const { count: finalCount, error: countError } = await supabase
      .from('flight_prices')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error(`⚠️ Could not verify final count: ${countError.message}`);
    } else {
      console.log(`- Rows inserted this run: ${insertedCount}`);
      console.log(`- Current database total: ${finalCount}`);
    }
  }
  console.log(`========================================\n`);
}

run().catch(console.error);
