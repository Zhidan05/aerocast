# Supabase Setup & Architecture for AeroCast

This document outlines the setup, schema, and security model for the AeroCast Supabase integration.

## 1. Environment Variables

To connect the application to your Supabase project, you must set the following environment variables in `.env.local` (ensure this file is never committed):

```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[YOUR_ANON_KEY]
```

**Security Note:** Never expose the `service_role` key to the client or commit it to your repository. It should only be used in a secure server environment if you are running bulk administrative scripts.

## 2. Initializing the Schema

Before the application can interact with the database, you must run the initial schema migration.

1. Open your Supabase Dashboard.
2. Navigate to the **SQL Editor**.
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`.
4. Paste and click **Run**.

## 3. Database Tables

The following tables are established for the AeroCast project:

*   **`flight_prices`**: Contains the historical flight data used as the basis for Monte Carlo simulations.
*   **`simulations`**: Stores the metadata and final statistics for a given Monte Carlo simulation run (e.g., mean, median, standard deviation).
*   **`simulation_buckets`**: Stores histogram/bucket data for the simulation, used to render probability distribution charts without sending thousands of samples to the client.
*   **`simulation_samples`**: (Optional) Stores a small subset of specific iteration samples if detailed auditing is required.
*   **`accuracy_tests`**: Stores the results of backtesting against historical data (MAE, MAPE, RMSE).

## 4. Row Level Security (RLS) Strategy

Given that AeroCast is currently an academic project without user authentication, the RLS policy is structured as follows:

*   **Read Access (`SELECT`)**: Allowed for anonymous users using the publishable/anon key. This allows the application UI to query flight data and past simulations.
*   **Write Access (`INSERT`, `UPDATE`, `DELETE`)**: **Disabled** for anonymous users. You cannot write data to any table directly from the browser using the anon key. 
    *   *Why?* To prevent malicious users from tampering with the historical dataset or flooding the simulations table. 
    *   *How to write?* For dataset imports or saving simulations, you should use server-side code with a `service_role` key or implement proper authentication later.

## 5. Indexes

To support efficient querying of the 300k+ row dataset, the following indexes are implemented:

*   `idx_flight_prices_search`: A composite index on `(source_city, destination_city, class, days_left)`. This perfectly matches the core query for selecting historical subsets.
*   `idx_flight_prices_airline`: For quickly filtering or grouping by airline.
*   `idx_flight_prices_price`: For queries sorting or filtering by price ranges.

## 6. Testing the Connection

A script is provided to verify your environment variables and confirm that the schema is properly installed in your Supabase project.

Run the following command from the project root:

```bash
node scripts/check-supabase.mjs
```

## 7. Dry-Run Dataset Import

The historical dataset (`Clean_Dataset.csv`) contains ~300k rows. You can validate the CSV structure and ensure it matches the database schema using a dry run.

```bash
node scripts/import-flight-prices.mjs --dry-run
```

## 8. Test Import (Subset)

To verify how a small batch of data parses, you can limit the run:

```bash
node scripts/import-flight-prices.mjs --dry-run --limit 100
```

## 9. Full Import Strategy

Because public write access is disabled by RLS, you have two options for performing the full dataset import:

**Option A (Recommended): Dashboard Import**
Clean the CSV locally, remove the `Unnamed: 0` index column, and use the Supabase Dashboard's CSV import tool directly into the `flight_prices` table.

**Option B: Server-Side Script**
Modify the import script to use the `service_role` key (passed via a secure server environment variable, *not* `NEXT_PUBLIC_*`). Implement batching (e.g., 1000 rows per batch) and use `supabase.from('flight_prices').insert(batch)` to push the data.

## 10. Security Notes

*   **Do not disable RLS globally.** 
*   If you encounter a permission error while writing, it means you are attempting an unauthorized write via the anon key. Move the logic to a secure server route or use the dashboard.
*   If you ever add authentication, you can update the RLS policies to `USING (auth.uid() = user_id)` for specific tables as needed.
