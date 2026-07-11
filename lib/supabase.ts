import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://bpfdfunkmndwviwfyovi.supabase.co';
const DEFAULT_KEY = 'sb_publishable_CwjadnejjA816OL-wJO8QA_o_uowhOg';

const getInitialCredentials = () => {
  if (typeof window !== 'undefined') {
    try {
      let localUrl = localStorage.getItem('movix_supabase_url');
      let localKey = localStorage.getItem('movix_supabase_anon_key');
      if (!localUrl || !localKey) {
        try {
          localStorage.setItem('movix_supabase_url', DEFAULT_URL);
          localStorage.setItem('movix_supabase_anon_key', DEFAULT_KEY);
        } catch (setErr) {
          console.warn('[Supabase] Could not write default keys to localStorage:', setErr);
        }
        localUrl = DEFAULT_URL;
        localKey = DEFAULT_KEY;
      }
      return { url: localUrl, key: localKey };
    } catch (e) {
      console.warn('[Supabase] Could not access localStorage, using defaults:', e);
    }
  }
  const rawUrl = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) : undefined;
  const supabaseAnonKey = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY) : undefined;
  return { url: rawUrl || DEFAULT_URL, key: supabaseAnonKey || DEFAULT_KEY };
};

const credentials = getInitialCredentials();
const rawUrl = credentials.url;
const supabaseAnonKey = credentials.key;

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
 * Useful when credentials are loaded from a server-side API or entered manually in the UI.
 */
export function initializeDynamicSupabase(url: string, key: string) {
  if (!url || !key) {
    console.warn('[Supabase] Tentativa de inicialização dinâmica com credenciais incompletas.');
    return null;
  }
  const cleanUrl = url.replace(/\/rest\/v1\/?$/, '');
  try {
    supabase = createClient(cleanUrl, key);
    console.log('[Supabase] Cliente dinâmico inicializado com sucesso via API do servidor/manual! ✔');
    
    // Save to localStorage if we are in browser to persist connection
    if (typeof window !== 'undefined') {
      localStorage.setItem('movix_supabase_url', cleanUrl);
      localStorage.setItem('movix_supabase_anon_key', key);
    }
    
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
