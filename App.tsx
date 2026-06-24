import 'react-native-url-polyfill/auto';
import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Montserrat_200ExtraLight,
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_400Regular_Italic,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { GFSDidot_400Regular } from '@expo-google-fonts/gfs-didot';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { UserProvider } from './src/context/UserContext';
import { WeatherProvider } from './src/context/WeatherContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { supabase } from './src/lib/supabase';
import { logEnvDiagnostics } from './src/utils/env';

SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    logEnvDiagnostics();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) console.warn('[NAIM] signInAnonymously error:', error);
          else {
            const id = data.user?.id ?? null;
            console.log('[NAIM] signInAnonymously OK — user.id:', id ?? 'NULL');
          }
        }
      } catch (err) {
        console.warn('[NAIM] Auth falló:', err);
      }
    })();
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    Montserrat_200ExtraLight,
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_400Regular_Italic,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    GFSDidot_400Regular,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <UserProvider>
            <WeatherProvider>
              <AppNavigator />
            </WeatherProvider>
          </UserProvider>
          <StatusBar style="dark" />
        </View>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
