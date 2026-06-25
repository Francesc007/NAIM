import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { WardrobeScreen } from '../screens/WardrobeScreen';
import { AddGarmentScreen } from '../screens/AddGarmentScreen';
import { SuggestionsScreen } from '../screens/SuggestionsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PrivacyNoticeScreen } from '../screens/PrivacyNoticeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { GarmentProvider } from '../context/GarmentContext';
import { AuthSessionProvider, useAuthSession } from '../context/AuthSessionContext';
import { HomeHeader } from '../components/HomeHeader';
import { NavGradientBackground } from '../components/NavGradientBackground';
import { colors, shadows, spacing, typography } from '../theme';
import { useTabBarBottomInset } from '../hooks/useTabBarBottomInset';
import { supabase } from '../lib/supabase';
import {
  hasCompletedOnboardingLocal,
  markOnboardingCompleted,
} from '../services/authService';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const headerTitleStyle = {
  fontFamily: typography.fontFamily.vogue,
  fontSize: 20,
  letterSpacing: 2,
};

const tabBarLabelStyle = {
  fontSize: 12,
  fontFamily: typography.fontFamily.regular,
  marginTop: 2,
};

function RenderTabBarLabel({
  focused,
  label,
}: {
  focused: boolean;
  label: string;
}) {
  return (
    <Text
      style={{
        fontSize: 12,
        marginTop: 2,
        fontFamily: focused ? typography.fontFamily.semiBold : typography.fontFamily.regular,
        color: focused ? colors.primaryVariant : colors.textSecondary,
      }}
    >
      {label}
    </Text>
  );
}

function AddTabScreen() {
  return <AddGarmentScreen hideBottomNav />;
}

function MainTabs() {
  const bottomInset = useTabBarBottomInset();
  const tabBarContentHeight = 56;
  const androidLift = Platform.OS === 'android' ? spacing.xs : 0;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primaryVariant,
        tabBarInactiveTintColor: colors.primaryVariant,
        tabBarStyle: {
          ...styles.tabBar,
          height: tabBarContentHeight + bottomInset + androidLift,
          paddingBottom: bottomInset + androidLift,
          paddingTop: spacing.xs,
          marginBottom: Platform.OS === 'android' ? 2 : 0,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle,
        headerStyle: styles.header,
        headerBackground: () => <NavGradientBackground />,
        headerTintColor: colors.textPrimary,
        headerTitleAlign: 'center',
        headerTitleStyle,
        headerShadowVisible: false,
        tabBarBackground: () => <NavGradientBackground />,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HomeHeader />,
          headerTitleContainerStyle: { width: '100%', left: 0, right: 0 },
          tabBarLabel: ({ focused }) => <RenderTabBarLabel focused={focused} label="Inicio" />,
          tabBarIcon: () => (
            <Ionicons name="sparkles" size={24} color={colors.primaryVariant} />
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddTabScreen}
        options={{
          title: 'Añadir Prenda',
          headerShown: true,
          headerBackVisible: false,
          headerLeft: () => null,
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View style={styles.addTabIcon}>
              <Ionicons name="add" size={28} color={colors.onPrimary} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Wardrobe"
        component={WardrobeScreen}
        options={{
          title: 'Mi Colección',
          tabBarLabel: ({ focused }) => (
            <RenderTabBarLabel focused={focused} label="Mi Colección" />
          ),
          tabBarIcon: () => (
            <Ionicons name="shirt-outline" size={24} color={colors.primaryVariant} />
          ),
          headerRight: () => null,
        }}
      />
    </Tab.Navigator>
  );
}

function RootStackNavigator() {
  const { session, booting, prefersLogin } = useAuthSession();
  const [resolvingOnboarding, setResolvingOnboarding] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let mounted = true;

    const resolveOnboarding = async () => {
      if (!session || !supabase) {
        if (mounted) {
          setNeedsOnboarding(false);
          setResolvingOnboarding(false);
        }
        return;
      }

      if (mounted) setResolvingOnboarding(true);

      try {
        const localDone = await hasCompletedOnboardingLocal();
        const { data } = await supabase.auth.getUser();
        const metadata = (data.user?.user_metadata ?? {}) as { onboarding_completed?: boolean };
        const remoteDone = metadata.onboarding_completed === true;

        if (!mounted) return;

        if (remoteDone && !localDone) {
          await markOnboardingCompleted();
        }

        setNeedsOnboarding(!(localDone || remoteDone));
      } catch (err) {
        console.warn('[NAIM] Resolver onboarding:', err);
        if (mounted) setNeedsOnboarding(true);
      } finally {
        if (mounted) setResolvingOnboarding(false);
      }
    };

    void resolveOnboarding();

    return () => {
      mounted = false;
    };
    // Solo cuando cambia el usuario (login/logout), no al actualizar nombre/foto.
  }, [session?.user?.id]);

  if (booting || resolvingOnboarding) {
    return (
      <View style={styles.bootWrap}>
        <ActivityIndicator size="large" color={colors.primaryVariant} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      key={
        session
          ? needsOnboarding
            ? 'authenticated-onboarding'
            : 'authenticated-main'
          : prefersLogin
            ? 'login'
            : 'unauth-onboarding'
      }
      initialRouteName={
        session ? (needsOnboarding ? 'Onboarding' : 'Main') : prefersLogin ? 'Login' : 'Onboarding'
      }
      screenOptions={{
        headerStyle: styles.header,
        headerBackground: () => <NavGradientBackground />,
        headerTintColor: colors.textPrimary,
        headerTitleAlign: 'center',
        headerTitleStyle,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="AddGarment"
        component={AddGarmentScreen}
        options={{
          title: 'Añadir Prenda',
          headerBackVisible: false,
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="Suggestions"
        component={SuggestionsScreen}
        options={{
          title: 'Sugerencias de Hoy',
          headerBackVisible: false,
          headerLeft: () => null,
        }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ajustes de Perfil' }} />
      <Stack.Screen
        name="PrivacyNotice"
        component={PrivacyNoticeScreen}
        options={{ title: 'Aviso de Privacidad' }}
      />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <AuthSessionProvider>
      <GarmentProvider>
        <NavigationContainer>
          <RootStackNavigator />
        </NavigationContainer>
      </GarmentProvider>
    </AuthSessionProvider>
  );
}

const styles = StyleSheet.create({
  bootWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: 'transparent',
  },
  tabBar: {
    backgroundColor: 'transparent',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    ...shadows.elevated,
  },
  addTabIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryVariant,
    ...shadows.card,
  },
});
