import { createClient } from '@supabase/supabase-js';

const rawUrl = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined;
const supabaseAnonKey = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined;

// Clean URL: remove any /rest/v1/ suffix for compatibility with @supabase/supabase-js
const supabaseUrl = rawUrl
  ? rawUrl.replace(/\/rest\/v1\/?$/, '')
  : undefined;

// Use export let for live ES module bindings
export let supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Initializes the Supabase client dynamically at runtime.
 * Useful when credentials are loaded from a server-side API.
 */
export function initializeDynamicSupabase(url: string, key: string) {
  if (!url || !key) {
    console.warn('[Supabase] Tentativa de inicialização dinâmica com credenciais incompletas.');
    return null;
  }
  const cleanUrl = url.replace(/\/rest\/v1\/?$/, '');
  try {
    supabase = createClient(cleanUrl, key);
    console.log('[Supabase] Cliente dinâmico inicializado com sucesso via API do servidor! ✔');
    return supabase;
  } catch (e) {
    console.error('[Supabase] Erro ao instanciar cliente dinâmico do Supabase:', e);
    return null;
  }
}

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error(
      'O Supabase não está configurado. Por favor, adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no painel de segredos do seu ambiente.'
    );
  }
  return supabase;
}

