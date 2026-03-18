import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { env } from '../utils/env';

let supabaseInstance: SupabaseClient | null = null;

try {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY;

  if (url && anonKey && url.length > 0 && anonKey.length > 0) {
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
