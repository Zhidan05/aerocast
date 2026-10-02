import { createServerClient } from '../supabase/server';
import type { Simulation } from '../database/types';

export interface GetExperimentsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  source?: string;
  destination?: string;
  cabinClass?: string;
  sort?: string; // e.g. "newest", "oldest", "price-high", "price-low", "iterations"
}

export async function getExperiments(options: GetExperimentsOptions = {}) {
  const { page = 1, pageSize = 20, search, source, destination, cabinClass, sort = "newest" } = options;
  const supabase = createServerClient();
  
  let query = supabase.from('simulations').select('*, accuracy_tests(id, mae, mape, rmse)', { count: 'exact' }).order('created_at', { ascending: false, referencedTable: 'accuracy_tests' });

  if (search) {
    query = query.or(`id.eq.${search},source_city.ilike.%${search}%,destination_city.ilike.%${search}%`);
  }
  if (source && source !== "all") query = query.eq('source_city', source);
  if (destination && destination !== "all") query = query.eq('destination_city', destination);
  if (cabinClass && cabinClass !== "all") query = query.eq('class', cabinClass);

  switch (sort) {
    case "oldest":
      query = query.order('created_at', { ascending: true });
      break;
    case "price-high":
      query = query.order('mean_price', { ascending: false });
      break;
    case "price-low":
      query = query.order('mean_price', { ascending: true });
      break;
    case "iterations":
      query = query.order('iteration_count', { ascending: false });
      break;
    case "newest":
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) {
    console.error('Error fetching experiments:', error);
    return { data: [], count: 0 };
  }

  return { data, count: count || 0 };
}

export async function getExperimentById(id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('simulations')
    .select('*, accuracy_tests(*)')
    .eq('id', id)
    .order('created_at', { ascending: false, referencedTable: 'accuracy_tests' })
    .single();

  if (error) {
    console.error(`Error fetching simulation ${id}:`, error);
    return null;
  }
  return data;
}

export async function getExperimentBuckets(id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('simulation_buckets')
    .select('*')
    .eq('simulation_id', id)
    .order('bucket_order', { ascending: true });
  return data || [];
}

export async function getExperimentSamples(id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('simulation_samples')
    .select('*')
    .eq('simulation_id', id)
    .order('iteration', { ascending: true });
  return data || [];
}

export async function getRecentSimulations(limit = 5) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('simulations')
    .select('*, accuracy_tests(id, mae, mape)')
    .order('created_at', { ascending: false, referencedTable: 'accuracy_tests' })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent simulations:', error);
    return [];
  }
  return data as any[];
}

export async function getExperimentsByIds(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('simulations')
    .select('*, accuracy_tests(id, mae, mape)')
    .in('id', ids)
    .order('created_at', { ascending: false, referencedTable: 'accuracy_tests' })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching simulations by ids:', error);
    return [];
  }
  return data;
}
