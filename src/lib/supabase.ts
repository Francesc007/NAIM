import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../utils/env';

let supabaseInstance: SupabaseClient | null = null;

try {
  const url = env.SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY;

  if (url && anonKey) {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
} catch (err) {
  console.warn('[NAIM] Supabase no inicializado:', err);
}

export const supabase = supabaseInstance;
