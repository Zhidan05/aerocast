import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseKey, validateEnv } from './env';
import type { Database } from '../database/types';

validateEnv();

export function createBrowserClient() {
  return createClient<Database>(supabaseUrl!, supabaseKey!);
}

export const supabase = createBrowserClient();
