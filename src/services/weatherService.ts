/**
 * Servicio de clima usando OpenWeather API
 * https://api.openweathermap.org/data/2.5/weather
 */

import { env } from '../utils/env';

const API_KEY = env.WEATHER_API_KEY ?? process.env.EXPO_PUBLIC_WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
}

export async function getCurrentWeather(
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  if (!API_KEY) {
    console.warn('[NAIM] Weather API key no encontrada. Revisa .env.');
    return null;
  }
  try {
    const url = `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      temp: Math.round(data.main?.temp ?? 0),
      condition: data.weather?.[0]?.description ?? '',
      icon: data.weather?.[0]?.icon ?? '01d',
    };
  } catch {
    return null;
  }
}
