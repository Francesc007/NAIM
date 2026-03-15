import Constants from 'expo-constants';

function getEnv(key: string): string | undefined {
  const fromProcess = process.env[key];
  if (fromProcess) return fromProcess;
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  return extra?.[key];
}

export const env = {
  get GEMINI_API_KEY() {
    return getEnv('EXPO_PUBLIC_GEMINI_API_KEY');
  },
  get WEATHER_API_KEY() {
    return getEnv('EXPO_PUBLIC_WEATHER_API_KEY');
  },
};
