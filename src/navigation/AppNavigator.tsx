import React from 'react';
import { View, StyleSheet } from 'react-native';
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
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { HomeHeader } from '../components/HomeHeader';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const headerTitleStyle = {
  fontFamily: typography.fontFamily.vogue,
  fontSize: 20,
  letterSpacing: 2,
};

function AddTabScreen() {
  return <AddGarmentScreen hideBottomNav />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: '#ADB5BD',
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        headerStyle: { backgroundColor: colors.accent },
        headerTintColor: colors.text,
        headerTitleAlign: 'center',
        headerTitleStyle,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HomeHeader />,
          headerTitleContainerStyle: { width: '100%', left: 0, right: 0 },
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="sparkles"
              size={24}
              color={focused ? colors.accent : '#ADB5BD'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddTabScreen}
        options={{
          title: 'Añadir prenda',
          headerShown: true,
          headerBackVisible: false,
          headerLeft: () => null,
          tabBarIcon: () => (
            <View style={styles.addTabIcon}>
              <Ionicons name="add" size={28} color="#fff" />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Wardrobe"
        component={WardrobeScreen}
        options={{
          title: 'Mi Colección',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="shirt-outline"
              size={24}
              color={focused ? colors.accent : '#ADB5BD'}
            />
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
            headerStyle: { backgroundColor: colors.accent },
            headerTintColor: colors.text,
            headerTitleAlign: 'center',
            headerTitleStyle,
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
              title: 'Añadir prenda',
              headerBackVisible: false,
              headerLeft: () => null,
            }}
          />
          <Stack.Screen
            name="Suggestions"
            component={SuggestionsScreen}
            options={{
              title: 'Sugerencias de hoy',
              headerBackVisible: false,
              headerLeft: () => null,
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Configuración' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GarmentProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopColor: '#E9ECEF',
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  addTabIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
});
