import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'naim_weather_cache_v1';
/** Mostrar caché hasta 6 h; luego se refresca en segundo plano. */
export const WEATHER_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export type CachedWeather = {
  temp: number;
  condition: string;
  icon: string;
  greeting: string;
  cachedAt: number;
};

export async function getCachedWeather(): Promise<CachedWeather | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedWeather;
    if (
      typeof parsed.temp !== 'number' ||
      !parsed.icon ||
      Date.now() - parsed.cachedAt > WEATHER_CACHE_MAX_AGE_MS
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedWeather(
  data: Omit<CachedWeather, 'cachedAt'>
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...data, cachedAt: Date.now() })
    );
  } catch {
    // ignorar fallos de caché
  }
}
