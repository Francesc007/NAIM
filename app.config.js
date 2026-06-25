/**
 * Configuración global de Expo.
 * Las variables EXPO_PUBLIC_* se cargan desde .env y se pasan a extra
 * para persistencia (Constants.expoConfig.extra).
 */
const path = require('path');

try {
  require('@expo/env').load(path.resolve(__dirname, '.env'));
} catch {
  // @expo/env viene con el CLI de Expo
}

const groqKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const weatherKey = process.env.EXPO_PUBLIC_WEATHER_API_KEY;

if (!groqKey || !weatherKey) {
  console.warn(
    '[NAIM app.config] ⚠️ Faltan keys en .env — Groq:',
    groqKey ? 'OK' : 'FALTA',
    '| Weather:',
    weatherKey ? 'OK' : 'FALTA'
  );
  console.warn('[NAIM app.config] Copia .env.example → .env y reinicia Metro (npm start)');
}

module.exports = {
  expo: {
    name: 'NAIM',
    slug: 'guardarropa-app',
    owner: 'frank_714mos',
    scheme: 'naim',
    version: '1.0.0',
    updates: {
      url: 'https://u.expo.dev/d5a29fa1-0095-4b17-84c0-68955e31b70e',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      bundleIdentifier: 'com.frank714mos.naim',
      supportsTablet: true,
      infoPlist: {
        CFBundleDevelopmentRegion: 'es',
        CFBundleLocalizations: ['es'],
      },
    },
    android: {
      package: 'com.frank714mos.naim',
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'naim',
              host: 'auth',
              pathPrefix: '/callback',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-font',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'NAIM usa tu ubicación para mostrarte el clima y sugerencias de outfit.',
          locationAlwaysAndWhenInUsePermission:
            'NAIM usa tu ubicación para mostrarte el clima y sugerencias de outfit.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'NAIM necesita acceso a tus fotos para añadir prendas a tu guardarropa.',
          colors: {
            cropBackgroundColor: '#F8F9FA',
            cropToolbarColor: '#DDBEA9',
            cropToolbarIconColor: '#212529',
            cropToolbarActionTextColor: '#212529',
            cropBackButtonIconColor: '#212529',
          },
        },
      ],
      './plugins/withSpanishUcropStrings.js',
    ],
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
