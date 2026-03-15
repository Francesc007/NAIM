import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { getCurrentWeather } from '../services/weatherService';
import { getMotivationalGreeting, getFallbackGreeting } from '../services/greetingService';

export interface WeatherGreetingState {
  greeting: string | null;
  temp: number | null;
  condition: string | null;
  icon: string | null;
  loading: boolean;
  locationError: string | null;
}

export function useWeatherGreeting() {
  const [state, setState] = useState<WeatherGreetingState>({
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
      const greeting = await getMotivationalGreeting(weather.temp, weather.condition);
      setState({
        greeting: greeting ?? getFallbackGreeting(weather.temp, weather.condition),
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
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return state;
}
