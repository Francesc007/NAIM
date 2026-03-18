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
import { AppNavigator } from './src/navigation/AppNavigator';
import { UserProvider } from './src/context/UserContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { supabase } from './src/lib/supabase';

SplashScreen.preventAutoHideAsync();

export default function App() {
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

  useFonts({
    Montserrat_200ExtraLight,
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_400Regular_Italic,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    GFSDidot_400Regular,
  });

  const onLayoutRootView = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <UserProvider>
          <AppNavigator />
        </UserProvider>
        <StatusBar style="dark" />
      </View>
    </ErrorBoundary>
  );
}
