import { createClient } from '@supabase/supabase-js';

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';
    _client = createClient(url, key);
  }
  return _client;
}

// Legacy export for any files that import { supabase }
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get: (_t, prop) => getSupabase()[prop as keyof ReturnType<typeof createClient>],
});
