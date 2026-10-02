-- Migration 003: Experiment Persistence

-- ==========================================
-- ADD COLUMNS & CONSTRAINTS TO simulations
-- ==========================================
ALTER TABLE public.simulations
ADD COLUMN IF NOT EXISTS client_run_id uuid UNIQUE;

-- ==========================================
-- ADD COLUMNS & CONSTRAINTS TO simulation_buckets
-- ==========================================
ALTER TABLE public.simulation_buckets
ADD COLUMN IF NOT EXISTS simulated_frequency integer not null default 0;

ALTER TABLE public.simulation_buckets
ADD CONSTRAINT uq_simulation_bucket_order UNIQUE (simulation_id, bucket_order);

-- ==========================================
-- ADD COLUMNS & CONSTRAINTS TO simulation_samples
-- ==========================================
ALTER TABLE public.simulation_samples
ADD CONSTRAINT uq_simulation_iteration UNIQUE (simulation_id, iteration);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_simulations_created_at 
ON public.simulations (created_at desc);

CREATE INDEX IF NOT EXISTS idx_simulations_search 
ON public.simulations (source_city, destination_city, class, days_left, created_at desc);

CREATE INDEX IF NOT EXISTS idx_simulation_buckets_sim_id 
ON public.simulation_buckets (simulation_id);

CREATE INDEX IF NOT EXISTS idx_simulation_samples_sim_id 
ON public.simulation_samples (simulation_id);

CREATE INDEX IF NOT EXISTS idx_accuracy_tests_sim_id 
ON public.accuracy_tests (simulation_id);

-- ==========================================
-- ATOMIC SAVE RPC
-- ==========================================
CREATE OR REPLACE FUNCTION public.save_monte_carlo_experiment(
    p_simulation jsonb,
    p_buckets jsonb,
    p_samples jsonb
) RETURNS uuid AS $$
DECLARE
    v_simulation_id uuid;
    v_client_run_id uuid;
BEGIN
    -- Extract optional client_run_id for idempotency
    v_client_run_id := (p_simulation->>'client_run_id')::uuid;

    IF v_client_run_id IS NOT NULL THEN
        -- Check if simulation already exists for this client_run_id
        SELECT id INTO v_simulation_id
        FROM public.simulations
        WHERE client_run_id = v_client_run_id
        LIMIT 1;

        IF FOUND THEN
            RETURN v_simulation_id;
        END IF;
    END IF;

    -- 1. Insert simulation parent
    INSERT INTO public.simulations (
        client_run_id,
        source_city,
        destination_city,
        class,
        days_left,
        days_tolerance,
        iteration_count,
        historical_sample_count,
        seed,
        mean_price,
        median_price,
        p25,
        p75,
        minimum_price,
        maximum_price,
        std_deviation,
        interval_95_low,
        interval_95_high
    )
    VALUES (
        v_client_run_id,
        p_simulation->>'source_city',
        p_simulation->>'destination_city',
        p_simulation->>'class',
        (p_simulation->>'days_left')::integer,
        (p_simulation->>'days_tolerance')::integer,
        (p_simulation->>'iteration_count')::integer,
        (p_simulation->>'historical_sample_count')::integer,
        (p_simulation->>'seed')::bigint,
        (p_simulation->>'mean_price')::numeric,
        (p_simulation->>'median_price')::numeric,
        (p_simulation->>'p25')::numeric,
        (p_simulation->>'p75')::numeric,
        (p_simulation->>'minimum_price')::numeric,
        (p_simulation->>'maximum_price')::numeric,
        (p_simulation->>'std_deviation')::numeric,
        (p_simulation->>'interval_95_low')::numeric,
        (p_simulation->>'interval_95_high')::numeric
    )
    RETURNING id INTO v_simulation_id;

    -- 2. Insert buckets
    INSERT INTO public.simulation_buckets (
        simulation_id,
        bucket_order,
        price_min,
        price_max,
        frequency,
        probability,
        cumulative_probability,
        random_min,
        random_max,
        simulated_frequency
    )
    SELECT
        v_simulation_id,
        (value->>'bucket_order')::integer,
        (value->>'price_min')::numeric,
        (value->>'price_max')::numeric,
        (value->>'frequency')::integer,
        (value->>'probability')::numeric,
        (value->>'cumulative_probability')::numeric,
        (value->>'random_min')::integer,
        (value->>'random_max')::integer,
        COALESCE((value->>'simulated_frequency')::integer, 0)
    FROM jsonb_array_elements(p_buckets);

    -- 3. Insert samples
    IF jsonb_array_length(p_samples) > 0 THEN
        INSERT INTO public.simulation_samples (
            simulation_id,
            iteration,
            random_number,
            price_range_min,
            price_range_max,
            sampled_price
        )
        SELECT
            v_simulation_id,
            (value->>'iteration')::integer,
            (value->>'random_number')::integer,
            (value->>'price_range_min')::numeric,
            (value->>'price_range_max')::numeric,
            (value->>'sampled_price')::numeric
        FROM jsonb_array_elements(p_samples);
    END IF;

    RETURN v_simulation_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Revoke execute from public/anon to restrict to service_role/admin
REVOKE EXECUTE ON FUNCTION public.save_monte_carlo_experiment(jsonb, jsonb, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_monte_carlo_experiment(jsonb, jsonb, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.save_monte_carlo_experiment(jsonb, jsonb, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.save_monte_carlo_experiment(jsonb, jsonb, jsonb) TO service_role;
