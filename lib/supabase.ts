import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Clean URL: remove any /rest/v1/ suffix for compatibility with @supabase/supabase-js
const supabaseUrl = rawUrl
  ? rawUrl.replace(/\/rest\/v1\/?$/, '')
  : undefined;

// Secure and lazy initialization to avoid crashing the dev server if keys are not set yet
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error(
      'O Supabase não está configurado. Por favor, adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no painel de segredos do seu ambiente.'
    );
  }
  return supabase;
}
