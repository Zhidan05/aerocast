-- Migration 002: Dataset Analytics RPCs

-- Returns a summary of the dataset
CREATE OR REPLACE FUNCTION public.get_dataset_summary()
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_records', (SELECT count(*) FROM public.flight_prices),
        'total_economy', (SELECT count(*) FROM public.flight_prices WHERE class = 'Economy'),
        'total_business', (SELECT count(*) FROM public.flight_prices WHERE class = 'Business'),
        'airlines', (SELECT count(DISTINCT airline) FROM public.flight_prices),
        'cities', (SELECT count(DISTINCT source_city) FROM public.flight_prices),
        'routes', (SELECT count(*) FROM (SELECT DISTINCT source_city, destination_city FROM public.flight_prices) AS unique_routes)
    ) INTO result;
    RETURN result;
END;
$$;

-- Returns average price by days left
CREATE OR REPLACE FUNCTION public.get_average_price_by_days_left()
RETURNS TABLE (days_left integer, average_price numeric)
LANGUAGE sql
SECURITY INVOKER
AS $$
    SELECT days_left, AVG(price) as average_price
    FROM public.flight_prices
    GROUP BY days_left
    ORDER BY days_left ASC;
$$;

-- Returns average price by airline
CREATE OR REPLACE FUNCTION public.get_average_price_by_airline()
RETURNS TABLE (airline text, average_price numeric)
LANGUAGE sql
SECURITY INVOKER
AS $$
    SELECT airline, AVG(price) as average_price
    FROM public.flight_prices
    GROUP BY airline
    ORDER BY average_price DESC;
$$;

-- Returns summary of average price and count by class
CREATE OR REPLACE FUNCTION public.get_class_price_summary()
RETURNS TABLE (class text, average_price numeric, total_records bigint)
LANGUAGE sql
SECURITY INVOKER
AS $$
    SELECT class, AVG(price) as average_price, COUNT(*) as total_records
    FROM public.flight_prices
    GROUP BY class;
$$;

-- Returns unique filter options
CREATE OR REPLACE FUNCTION public.get_unique_filters()
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'airlines', (SELECT json_agg(DISTINCT airline) FROM public.flight_prices),
        'source_cities', (SELECT json_agg(DISTINCT source_city) FROM public.flight_prices),
        'destination_cities', (SELECT json_agg(DISTINCT destination_city) FROM public.flight_prices),
        'classes', (SELECT json_agg(DISTINCT class) FROM public.flight_prices)
    ) INTO result;
    RETURN result;
END;
$$;

-- Grant execute to anonymous and authenticated users for read-only access via API
GRANT EXECUTE ON FUNCTION public.get_dataset_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_average_price_by_days_left() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_average_price_by_airline() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_class_price_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_unique_filters() TO anon, authenticated;
