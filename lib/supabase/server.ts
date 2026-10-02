import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseKey, validateEnv } from './env';
import type { Database } from '../database/types';

validateEnv();

// In the future, if you add @supabase/ssr for auth, this function would take cookies/headers.
// For now, it simply creates a Supabase client using the anon/publishable key for server components.
export function createServerClient() {
  return createClient<Database>(supabaseUrl!, supabaseKey!);
}
