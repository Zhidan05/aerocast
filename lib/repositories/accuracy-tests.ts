import { createServerClient } from '../supabase/server';

export interface AccuracyFilter {
  page?: number;
  pageSize?: number;
  source?: string;
  destination?: string;
  class?: string;
  simulationId?: string;
  sort?: string;
}

export async function getAccuracyTestById(id: string): Promise<any> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('accuracy_tests')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getAccuracyTests(filter: AccuracyFilter = {}): Promise<{ data: any[], count: number }> {
  const supabase = createServerClient();
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 10;
  
  let query = supabase
    .from('accuracy_tests')
    .select('*', { count: 'exact' });

  if (filter.source) query = query.eq('source_city', filter.source);
  if (filter.destination) query = query.eq('destination_city', filter.destination);
  if (filter.class) query = query.eq('class', filter.class);
  if (filter.simulationId) query = query.eq('simulation_id', filter.simulationId);

  if (filter.sort === 'date_asc') query = query.order('created_at', { ascending: true });
  else if (filter.sort === 'mape_asc') query = query.order('mape', { ascending: true });
  else if (filter.sort === 'mape_desc') query = query.order('mape', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return { data, count: count || 0 };
}

export async function getLatestAccuracyForSimulation(simulationId: string): Promise<any> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('accuracy_tests')
    .select('*')
    .eq('simulation_id', simulationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAccuracyTestsForSimulation(simulationId: string): Promise<any[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('accuracy_tests')
    .select('*')
    .eq('simulation_id', simulationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getRecentAccuracyTests(limit: number = 5): Promise<any[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('accuracy_tests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getAccuracySummary(): Promise<any> {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('get_accuracy_summary');
  const result = data as any;
  if (error) throw error;
  return result && result.length > 0 ? result[0] : null;
}
