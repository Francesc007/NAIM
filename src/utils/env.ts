import Constants from 'expo-constants';

/**
 * Expo inyecta EXPO_PUBLIC_* solo con notación de punto (process.env.EXPO_PUBLIC_X).
 * El acceso dinámico process.env[key] NO se reemplaza en build.
 * Por eso usamos acceso directo para las vars críticas.
 */
function fromProcess(key: string): string | undefined {
  if (key === 'EXPO_PUBLIC_WEATHER_API_KEY') return process.env.EXPO_PUBLIC_WEATHER_API_KEY?.trim();
  if (key === 'EXPO_PUBLIC_SUPABASE_URL') return process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  if (key === 'EXPO_PUBLIC_SUPABASE_ANON_KEY') return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (key === 'EXPO_PUBLIC_GROQ_API_KEY') return process.env.EXPO_PUBLIC_GROQ_API_KEY?.trim();
  return process.env[key]?.trim();
}

function getEnv(key: string): string | undefined {
  const fromProc = fromProcess(key);
  if (fromProc) return fromProc;
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  const val = extra?.[key];
  return val != null ? String(val).trim() : undefined;
}

export const env = {
  get WEATHER_API_KEY() {
    return getEnv('EXPO_PUBLIC_WEATHER_API_KEY');
  },
  get SUPABASE_URL() {
    return getEnv('EXPO_PUBLIC_SUPABASE_URL');
  },
  get SUPABASE_ANON_KEY() {
    return getEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  },
  get GROQ_API_KEY() {
    return getEnv('EXPO_PUBLIC_GROQ_API_KEY');
  },
};
