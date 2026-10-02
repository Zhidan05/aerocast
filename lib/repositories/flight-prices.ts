import { createServerClient } from '../supabase/server';
import type { FlightPrice } from '../database/types';

export async function getDatasetSummary() {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('get_dataset_summary');

  if (error || !data) {
    console.error('Error fetching dataset summary (did you run migration 002?):', error?.message);
    // Fallback if RPC not found
    return {
      total_records: 0,
      total_economy: 0,
      total_business: 0,
      airlines: 0,
      cities: 0,
      routes: 0
    };
  }
  return data;
}

export async function getUniqueFilters() {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('get_unique_filters');

  if (error || !data) {
    console.error('Error fetching unique filters (did you run migration 002?):', error?.message);
    return {
      airlines: [],
      source_cities: [],
      destination_cities: [],
    classes: []
    };
  }
  
  const res = data as Record<string, string[]>;
  return {
    airlines: res.airlines || [],
    source_cities: res.source_cities || [],
    destination_cities: res.destination_cities || [],
    classes: res.classes || []
  };
}

export async function getAveragePriceByDaysLeft() {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('get_average_price_by_days_left');
  
  if (error || !data) {
    console.error('Error fetching average price by days left:', error?.message);
    return [];
  }
  return data;
}

export async function getAveragePriceByAirline() {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('get_average_price_by_airline');
  
  if (error || !data) {
    console.error('Error fetching average price by airline:', error?.message);
    return [];
  }
  return data;
}

export async function getClassPriceSummary() {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('get_class_price_summary');
  
  if (error || !data) {
    console.error('Error fetching class price summary:', error?.message);
    return [];
  }
  return data;
}

export interface FlightPricesQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  airline?: string;
  source?: string;
  destination?: string;
  travelClass?: string;
  daysRange?: string; // "all", "7", "14", "49"
  priceRange?: string; // "all", "10000", "30000", "above"
  sortKey?: string; // "airline", "daysLeft", "price"
  sortDir?: "asc" | "desc";
}

export async function getFlightPrices(options: FlightPricesQueryOptions = {}) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  const supabase = createServerClient();
  let query = supabase.from('flight_prices').select('*', { count: 'exact' });

  // Filters
  if (options.airline && options.airline !== 'all') {
    query = query.eq('airline', options.airline);
  }
  if (options.source && options.source !== 'all') {
    query = query.eq('source_city', options.source);
  }
  if (options.destination && options.destination !== 'all') {
    query = query.eq('destination_city', options.destination);
  }
  if (options.travelClass && options.travelClass !== 'all') {
    query = query.eq('class', options.travelClass);
  }
  
  // Days Range
  if (options.daysRange && options.daysRange !== 'all') {
    if (options.daysRange === '7') {
      query = query.lte('days_left', 7);
    } else if (options.daysRange === '14') {
      query = query.gte('days_left', 8).lte('days_left', 14);
    } else if (options.daysRange === '49') {
      query = query.gte('days_left', 15);
    }
  }

  // Price Range
  if (options.priceRange && options.priceRange !== 'all') {
    if (options.priceRange === '10000') {
      query = query.lt('price', 10000);
    } else if (options.priceRange === '30000') {
      query = query.gte('price', 10000).lt('price', 30000);
    } else if (options.priceRange === 'above') {
      query = query.gte('price', 30000);
    }
  }

  // Search Text
  if (options.search && options.search.trim() !== '') {
    const searchTerm = `%${options.search.trim()}%`;
    query = query.or(`airline.ilike.${searchTerm},flight.ilike.${searchTerm},source_city.ilike.${searchTerm},destination_city.ilike.${searchTerm}`);
  }

  // Sorting
  const sortCol = options.sortKey === 'daysLeft' ? 'days_left' : 
                  options.sortKey === 'airline' ? 'airline' :
                  options.sortKey === 'price' ? 'price' : 'id'; // default sort by id
  
  query = query.order(sortCol, { ascending: options.sortDir === 'asc' });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching flight prices:', error.message);
    return { data: [], count: 0 };
  }

  return { data: data as FlightPrice[], count: count || 0 };
}

export async function getHistoricalSubset(options: { sourceCity: string; destinationCity: string; flightClass: string; daysLeft: number; daysTolerance: number; }) {
  // Unchanged for now as Monte Carlo is not implemented yet
  const supabase = createServerClient();
  const minDays = Math.max(0, options.daysLeft - options.daysTolerance);
  const maxDays = options.daysLeft + options.daysTolerance;

  const { data, error } = await supabase
    .from('flight_prices')
    .select('id, price, days_left, airline')
    .eq('source_city', options.sourceCity)
    .eq('destination_city', options.destinationCity)
    .eq('class', options.flightClass)
    .gte('days_left', minDays)
    .lte('days_left', maxDays);

  if (error) throw new Error(error.message);
  return data;
}
