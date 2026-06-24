import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { getCurrentWeather } from '../services/weatherService';
import { getWeatherMessage } from '../services/greetingService';
import { getCachedWeather, setCachedWeather } from '../services/weatherCache';

export interface WeatherState {
  greeting: string | null;
  temp: number | null;
  condition: string | null;
  icon: string | null;
  loading: boolean;
  locationError: string | null;
  apiError: string | null;
}

interface WeatherContextType extends WeatherState {
  refresh: () => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

function hasWeatherData(state: Pick<WeatherState, 'temp' | 'icon' | 'greeting'>): boolean {
  return state.temp !== null || state.icon !== null || state.greeting !== null;
}

function coordsChanged(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): boolean {
  return (
    Math.abs(a.latitude - b.latitude) > 0.02 ||
    Math.abs(a.longitude - b.longitude) > 0.02
  );
}

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WeatherState>({
    greeting: null,
    temp: null,
    condition: null,
    icon: null,
    loading: true,
    locationError: null,
    apiError: null,
  });

  const applyWeather = useCallback(async (lat: number, lon: number): Promise<boolean> => {
    const weatherResult = await getCurrentWeather(lat, lon);
    if (!weatherResult.ok) {
      setState((s) => ({
        ...s,
        loading: false,
        apiError: hasWeatherData(s) ? null : weatherResult.error,
      }));
      return false;
    }

    const weather = weatherResult.data;
    const greeting = getWeatherMessage(weather.temp, weather.icon);

    await setCachedWeather({
      temp: weather.temp,
      condition: weather.condition,
      icon: weather.icon,
      greeting,
    });

    setState({
      greeting,
      temp: weather.temp,
      condition: weather.condition,
      icon: weather.icon,
      loading: false,
      locationError: null,
      apiError: null,
    });
    return true;
  }, []);

  const fetchWeather = useCallback(async () => {
    const cached = await getCachedWeather();

    setState((s) => {
      const base = cached && !hasWeatherData(s)
        ? {
            ...s,
            greeting: cached.greeting,
            temp: cached.temp,
            condition: cached.condition,
            icon: cached.icon,
          }
        : s;

      return {
        ...base,
        loading: !hasWeatherData(base),
        locationError: null,
        apiError: null,
      };
    });

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState((s) => ({
          ...s,
          loading: false,
          locationError: hasWeatherData(s)
            ? null
            : 'Permiso de ubicación denegado. Actívalo en Ajustes para ver el clima.',
          apiError: null,
        }));
        return;
      }

      const lastKnown = await Location.getLastKnownPositionAsync();
      let resolved = Boolean(cached);

      if (lastKnown) {
        resolved = (await applyWeather(lastKnown.coords.latitude, lastKnown.coords.longitude)) || resolved;
      }

      try {
        const fresh = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          maximumAge: 120_000,
        });

        if (!lastKnown || coordsChanged(lastKnown.coords, fresh.coords) || !resolved) {
          await applyWeather(fresh.coords.latitude, fresh.coords.longitude);
        } else {
          setState((s) => ({ ...s, loading: false }));
        }
      } catch (positionErr) {
        if (!resolved) {
          throw positionErr;
        }
        setState((s) => ({ ...s, loading: false }));
      }
    } catch (err) {
      console.warn('[NAIM] Clima: Error ubicación/clima:', err);
      setState((s) => {
        if (hasWeatherData(s)) {
          return { ...s, loading: false };
        }
        return {
          ...s,
          loading: false,
          locationError: 'No se pudo obtener la ubicación. Revisa los permisos.',
          apiError: null,
        };
      });
    }
  }, [applyWeather]);

  useEffect(() => {
    void fetchWeather();
  }, [fetchWeather]);

  useEffect(() => {
    const interval = setInterval(fetchWeather, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return (
    <WeatherContext.Provider value={{ ...state, refresh: fetchWeather }}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used within WeatherProvider');
  return ctx;
}
