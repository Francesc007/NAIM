import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { getCurrentWeather } from '../services/weatherService';
import { getWeatherMessage } from '../services/greetingService';

export interface WeatherState {
  greeting: string | null;
  temp: number | null;
  condition: string | null;
  icon: string | null;
  loading: boolean;
  locationError: string | null;
}

interface WeatherContextType extends WeatherState {
  refresh: () => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WeatherState>({
    greeting: null,
    temp: null,
    condition: null,
    icon: null,
    loading: true,
    locationError: null,
  });

  const fetchWeather = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState((s) => ({
          ...s,
          loading: false,
          locationError: 'Permiso de ubicación denegado. Actívalo en Ajustes para ver el clima.',
        }));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const location = { lat: loc.coords.latitude, lon: loc.coords.longitude };
      const weather = await getCurrentWeather(location.lat, location.lon);

      if (!weather) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }
      const greeting = getWeatherMessage(weather.temp, weather.icon);
      setState({
        greeting,
        temp: weather.temp,
        condition: weather.condition,
        icon: weather.icon,
        loading: false,
        locationError: null,
      });
    } catch (err) {
      console.warn('[NAIM] Error ubicación/clima:', err);
      setState((s) => ({
        ...s,
        loading: false,
        locationError: 'No se pudo obtener la ubicación. Revisa los permisos.',
      }));
    }
  }, []);

  useEffect(() => {
    fetchWeather();
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
