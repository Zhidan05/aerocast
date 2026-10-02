-- Migration 004: Accuracy Persistence and Dashboard Metrics

-- 1. Add new columns to accuracy_tests table without altering existing columns destructively
ALTER TABLE public.accuracy_tests
ADD COLUMN IF NOT EXISTS split_seed bigint,
ADD COLUMN IF NOT EXISTS monte_carlo_seed bigint,
ADD COLUMN IF NOT EXISTS bias numeric,
ADD COLUMN IF NOT EXISTS interval_coverage numeric,
ADD COLUMN IF NOT EXISTS interval_width numeric,
ADD COLUMN IF NOT EXISTS inside_interval_count integer,
ADD COLUMN IF NOT EXISTS outside_interval_count integer,
ADD COLUMN IF NOT EXISTS expected_price numeric,
ADD COLUMN IF NOT EXISTS interval_95_low numeric,
ADD COLUMN IF NOT EXISTS interval_95_high numeric,
ADD COLUMN IF NOT EXISTS source_city text,
ADD COLUMN IF NOT EXISTS destination_city text,
ADD COLUMN IF NOT EXISTS class text,
ADD COLUMN IF NOT EXISTS days_left integer,
ADD COLUMN IF NOT EXISTS days_tolerance integer,
ADD COLUMN IF NOT EXISTS iteration_count integer,
ADD COLUMN IF NOT EXISTS client_run_id uuid UNIQUE,
ADD COLUMN IF NOT EXISTS error_histogram jsonb;

-- accuracy_tests.simulation_id already has ON DELETE SET NULL from migration 001.

-- 2. Create RPC for Accuracy Summary
CREATE OR REPLACE FUNCTION public.get_accuracy_summary()
RETURNS TABLE (
    total_evaluations bigint,
    average_mae numeric,
    average_mape numeric,
    average_rmse numeric,
    average_interval_coverage numeric
) 
SECURITY INVOKER
LANGUAGE sql
AS $$
    SELECT 
        COUNT(*) as total_evaluations,
        AVG(mae) as average_mae,
        AVG(mape) as average_mape,
        AVG(rmse) as average_rmse,
        AVG(interval_coverage) as average_interval_coverage
    FROM public.accuracy_tests
    WHERE mape IS NOT NULL AND mape != 'NaN'::numeric AND mape != 'Infinity'::numeric;
$$;
