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
import { NaimDialog } from '../components/NaimDialog';
import { HomeHeader } from '../components/HomeHeader';
import { NavBrandLogo } from '../components/NavBrandLogo';
import { NavGradientBackground } from '../components/NavGradientBackground';
import { navigationRef } from './navigationRef';
import { colors, shadows, spacing, typography } from '../theme';
import { useTabBarLayout } from '../hooks/useTabBarBottomInset';
import { supabase } from '../lib/supabase';
import {
  hasCompletedOnboardingLocal,
  markOnboardingCompleted,
  markProtectionNoticeSeen,
} from '../services/authService';
import { getProfileFromSupabase } from '../services/profileService';
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

const navLogoHeaderOptions = {
  headerTitle: () => <NavBrandLogo />,
  headerTitleAlign: 'center' as const,
  headerTitleContainerStyle: { width: '100%', left: 0, right: 0 },
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

function AuthLinkNoticeHost() {
  const { authLinkNotice, clearAuthLinkNotice, session } = useAuthSession();

  if (!authLinkNotice) return null;

  const isEmailConfirm = authLinkNotice.kind === 'email_confirm';

  return (
    <NaimDialog
      visible
      title={
        isEmailConfirm
          ? 'Guardarropa protegido'
          : authLinkNotice.type === 'success'
            ? 'Listo'
            : 'No pudimos confirmar'
      }
      message={authLinkNotice.message}
      tone={authLinkNotice.type === 'success' ? 'success' : 'info'}
      primaryText="Entendido"
      onDismiss={() => {
        if (isEmailConfirm && session?.user.id) {
          void markProtectionNoticeSeen(session.user.id);
        }
        clearAuthLinkNotice();
      }}
    />
  );
}

function AddTabScreen() {
  return <AddGarmentScreen hideBottomNav />;
}

function MainTabs() {
  const { paddingBottom: bottomInset, marginBottom: tabBarMarginBottom } = useTabBarLayout();
  const tabBarContentHeight = 56;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primaryVariant,
        tabBarInactiveTintColor: colors.primaryVariant,
        tabBarStyle: {
          ...styles.tabBar,
          height: tabBarContentHeight + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: spacing.xs,
          marginBottom: tabBarMarginBottom,
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
          ...navLogoHeaderOptions,
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
          ...navLogoHeaderOptions,
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
        const profile = await getProfileFromSupabase();
        const remoteDone = profile.onboardingCompleted;

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
          ...navLogoHeaderOptions,
          headerBackVisible: false,
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="Suggestions"
        component={SuggestionsScreen}
        options={{
          ...navLogoHeaderOptions,
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
        <NavigationContainer ref={navigationRef}>
          <RootStackNavigator />
        </NavigationContainer>
        <AuthLinkNoticeHost />
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
