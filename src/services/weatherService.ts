/**
 * Servicio de clima usando OpenWeather API.
 * Requiere EXPO_PUBLIC_WEATHER_API_KEY en .env o EAS Secrets.
 */
import { env } from '../utils/env';

const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
}

export type WeatherResult =
  | { ok: true; data: WeatherData }
  | { ok: false; error: string };

export async function getCurrentWeather(
  lat: number,
  lon: number
): Promise<WeatherResult> {
  const apiKey = env.WEATHER_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    const msg =
      'Falta EXPO_PUBLIC_WEATHER_API_KEY. Si usas APK de EAS, reconstruye con eas build --profile preview. Si usas Expo Go, verifica .env y reinicia npm start.';
    console.warn('[NAIM] Clima:', msg);
    return { ok: false, error: msg };
  }

  try {
    const url = `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=es`;
    const res = await fetch(url);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const apiMsg = (errorData as { message?: string }).message ?? `HTTP ${res.status}`;
      const msg = `OpenWeather rechazó la petición (${apiMsg}). Revisa tu API key en openweathermap.org.`;
      console.warn('[NAIM] Clima:', errorData);
      return { ok: false, error: msg };
    }

    const data = await res.json();
    console.log('[NAIM] Clima: OK, temp:', data.main?.temp);

    return {
      ok: true,
      data: {
        temp: Math.round(data.main?.temp ?? 0),
        condition: data.weather?.[0]?.description ?? '',
        icon: data.weather?.[0]?.icon ?? '01d',
      },
    };
  } catch (err) {
    const msg = 'Error de red al consultar OpenWeather. Verifica tu conexión.';
    console.warn('[NAIM] Clima:', msg, err);
    return { ok: false, error: msg };
  }
}
