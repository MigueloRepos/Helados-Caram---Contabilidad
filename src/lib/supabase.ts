import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Detect credentials from env, fallback defaults or local storage overrides
const DEFAULT_URL = 'https://uxhnefqtdcemlooddwpr.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4aG5lZnF0ZGNlbWxvb2Rkd3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDg4MzYsImV4cCI6MjEwMzg4NDgzNn0.oNhPO9CWbAkztWlRgEswepliqwRt7cf78FCz0g7GLOM';

const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_URL;
const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

let storedUrl = typeof window !== 'undefined' ? localStorage.getItem('hc_supabase_url') || '' : '';
let storedKey = typeof window !== 'undefined' ? localStorage.getItem('hc_supabase_anon_key') || '' : '';

// If stored key is old secret or publishable key, clean it to use proper JWT anon key
if (storedKey && (storedKey.startsWith('sb_secret_') || storedKey.startsWith('sb_publishable_'))) {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hc_supabase_anon_key');
  }
  storedKey = '';
}

export const activeSupabaseUrl = storedUrl || envUrl || DEFAULT_URL;
export const activeSupabaseKey = storedKey || envKey || DEFAULT_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  activeSupabaseUrl && 
  activeSupabaseKey && 
  activeSupabaseUrl.startsWith('https://') &&
  !activeSupabaseUrl.includes('tu-proyecto') &&
  activeSupabaseKey.length > 20
);

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClientInstance) {
    const url = activeSupabaseUrl || DEFAULT_URL;
    const key = activeSupabaseKey || DEFAULT_ANON_KEY;
    
    supabaseClientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseClientInstance;
}

export const supabase = getSupabaseClient();

export function setCustomSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('hc_supabase_url', url.trim());
      localStorage.setItem('hc_supabase_anon_key', key.trim());
    } else {
      localStorage.removeItem('hc_supabase_url');
      localStorage.removeItem('hc_supabase_anon_key');
    }
    // Force reload client
    supabaseClientInstance = null;
    window.location.reload();
  }
}

