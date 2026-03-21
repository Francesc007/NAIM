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
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
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
          colors: {
            cropBackgroundColor: '#F8F9FA',
            cropToolbarColor: '#DDBEA9',
            cropToolbarIconColor: '#212529',
            cropToolbarActionTextColor: '#212529',
            cropBackButtonIconColor: '#212529',
          },
        },
      ],
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
