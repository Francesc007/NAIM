import React from 'react';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { WardrobeScreen } from '../screens/WardrobeScreen';
import { AddGarmentScreen } from '../screens/AddGarmentScreen';
import { SuggestionsScreen } from '../screens/SuggestionsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { GarmentProvider } from '../context/GarmentContext';
import { HomeHeader } from '../components/HomeHeader';
import { NavGradientBackground } from '../components/NavGradientBackground';
import { colors, shadows, spacing, typography } from '../theme';
import { useTabBarBottomInset } from '../hooks/useTabBarBottomInset';
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

export function AppNavigator() {
  return (
    <GarmentProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: styles.header,
            headerBackground: () => <NavGradientBackground />,
            headerTintColor: colors.textPrimary,
            headerTitleAlign: 'center',
            headerTitleStyle,
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen
            name="MainHome"
            component={MainTabs}
            options={{ headerShown: false }}
          />
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
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Ajustes de Perfil' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GarmentProvider>
  );
}

const styles = StyleSheet.create({
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
