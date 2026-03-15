import { useCallback } from 'react';
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

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Montserrat_200ExtraLight,
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_400Regular_Italic,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    GFSDidot_400Regular,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <UserProvider>
        <AppNavigator />
      </UserProvider>
      <StatusBar style="dark" />
    </View>
  );
}
