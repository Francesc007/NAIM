import Constants from 'expo-constants';

/**
 * Acceso ESTÁTICO a process.env — Metro/Expo solo inlined EXPO_PUBLIC_* con notación de punto.
 * No usar process.env[key] dinámico.
 */
const STATIC = {
  WEATHER: process.env.EXPO_PUBLIC_WEATHER_API_KEY?.trim(),
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim(),
  SUPABASE_ANON: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  GROQ: process.env.EXPO_PUBLIC_GROQ_API_KEY?.trim(),
};

function readExtra(key: string): string | undefined {
  const extra =
    Constants.expoConfig?.extra ??
    (Constants as { manifest2?: { extra?: Record<string, string> } }).manifest2?.extra ??
    (Constants as { manifest?: { extra?: Record<string, string> } }).manifest?.extra;

  const val = extra?.[key];
  if (val == null) return undefined;
  const trimmed = String(val).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function pick(...values: (string | undefined)[]): string | undefined {
  for (const v of values) {
    if (v && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

export const env = {
  get WEATHER_API_KEY() {
    return pick(STATIC.WEATHER, readExtra('EXPO_PUBLIC_WEATHER_API_KEY'));
  },
  get SUPABASE_URL() {
    return pick(STATIC.SUPABASE_URL, readExtra('EXPO_PUBLIC_SUPABASE_URL'));
  },
  get SUPABASE_ANON_KEY() {
    return pick(STATIC.SUPABASE_ANON, readExtra('EXPO_PUBLIC_SUPABASE_ANON_KEY'));
  },
  get GROQ_API_KEY() {
    return pick(STATIC.GROQ, readExtra('EXPO_PUBLIC_GROQ_API_KEY'));
  },
};

function maskKey(value?: string): string {
  if (!value) return 'FALTA';
  if (value.length <= 8) return 'OK (corta)';
  return `OK (${value.slice(0, 4)}…${value.slice(-4)})`;
}

/** Diagnóstico al arrancar — ver consola Metro / Expo Go */
export function logEnvDiagnostics(): void {
  console.log('[NAIM] === DIAGNÓSTICO ENV ===');
  console.log('[NAIM] WEATHER:', maskKey(env.WEATHER_API_KEY), '| static:', Boolean(STATIC.WEATHER));
  console.log('[NAIM] GROQ:   ', maskKey(env.GROQ_API_KEY), '| static:', Boolean(STATIC.GROQ));
  console.log('[NAIM] SUPABASE URL:', env.SUPABASE_URL ? 'OK' : 'FALTA');
  console.log('[NAIM] SUPABASE KEY:', maskKey(env.SUPABASE_ANON_KEY));
  const extra = Constants.expoConfig?.extra ?? {};
  const publicExtra = Object.keys(extra).filter((k) => k.startsWith('EXPO_PUBLIC_'));
  console.log('[NAIM] extra EXPO_PUBLIC keys:', publicExtra.length ? publicExtra.join(', ') : 'ninguna');
  if (!env.GROQ_API_KEY || !env.WEATHER_API_KEY) {
    console.warn(
      '[NAIM] ⚠️ Faltan API keys. Si usas APK de EAS, reconstruye con: eas build --profile preview'
    );
    console.warn('[NAIM] Si usas Expo Go: verifica .env en guardarropa-app/ y reinicia con npm start');
  }
}
