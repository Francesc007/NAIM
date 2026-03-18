/**
 * Configuración global de Expo.
 * Las variables EXPO_PUBLIC_* se cargan desde .env y se pasan a extra
 * para persistencia (Constants.expoConfig.extra).
 * Mantén .env actualizado con EXPO_PUBLIC_GROQ_API_KEY.
 */
module.exports = {
  expo: {
    name: 'Guardaropa Inteligente',
    slug: 'guardarropa-app',
    version: '1.0.0',
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_GROQ_API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY,
      EXPO_PUBLIC_WEATHER_API_KEY: process.env.EXPO_PUBLIC_WEATHER_API_KEY,
    },
  },
};
