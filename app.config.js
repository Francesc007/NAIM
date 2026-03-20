/**
 * Configuración global de Expo.
 * Las variables EXPO_PUBLIC_* se cargan desde .env y se pasan a extra
 * para persistencia (Constants.expoConfig.extra).
 * Mantén .env actualizado con EXPO_PUBLIC_GROQ_API_KEY.
 */
module.exports = {
  expo: {
    name: 'NAIM',
    slug: 'guardarropa-app',
    owner: 'frank_714mos',
    version: '1.0.0',
    updates: {
      url: 'https://u.expo.dev/d5a29fa1-0095-4b17-84c0-68955e31b70e',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    extra: {
      eas: {
        projectId: 'd5a29fa1-0095-4b17-84c0-68955e31b70e',
      },
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_GROQ_API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY,
      EXPO_PUBLIC_WEATHER_API_KEY: process.env.EXPO_PUBLIC_WEATHER_API_KEY,
    },
  },
};
