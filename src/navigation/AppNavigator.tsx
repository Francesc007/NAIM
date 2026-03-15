import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { WardrobeScreen } from '../screens/WardrobeScreen';
import { AddGarmentScreen } from '../screens/AddGarmentScreen';
import { SuggestionsScreen } from '../screens/SuggestionsScreen';
import { GarmentProvider } from '../context/GarmentContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { HomeHeader } from '../components/HomeHeader';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.tabsWrapper}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: '#ADB5BD',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          headerStyle: { backgroundColor: colors.accent },
          headerTintColor: colors.text,
          headerTitleAlign: 'center',
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerTitle: () => <HomeHeader />,
            headerTitleContainerStyle: { width: '100%', left: 0, right: 0 },
            tabBarLabel: 'Inicio',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name="sparkles"
                size={size}
                color={focused ? colors.accent : '#ADB5BD'}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Wardrobe"
          component={WardrobeScreen}
          options={{
            title: 'Mi Colección',
            tabBarLabel: 'Mi Colección',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name="shirt-outline"
                size={size}
                color={focused ? colors.accent : '#ADB5BD'}
              />
            ),
            headerRight: () => null,
          }}
        />
      </Tab.Navigator>

      {/* FAB global - visible en ambas tabs */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddGarment')}
        activeOpacity={0.9}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
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
        </Stack.Navigator>
      </NavigationContainer>
    </GarmentProvider>
  );
}

const styles = StyleSheet.create({
  tabsWrapper: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: colors.background,
    borderTopColor: '#E9ECEF',
    borderTopWidth: 1,
  },
  tabBarLabel: {
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 100,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: colors.text,
    fontFamily: typography.fontFamily.light,
    lineHeight: 32,
  },
});
