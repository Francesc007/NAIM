import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export function StackBottomNav() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const goToHome = () => {
    navigation.navigate('MainHome', { screen: 'Home' });
  };

  const goToWardrobe = () => {
    navigation.navigate('MainHome', { screen: 'Wardrobe' });
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <TouchableOpacity style={styles.tab} onPress={goToHome} activeOpacity={0.7}>
        <Ionicons name="sparkles" size={24} color={colors.accent} />
        <Text style={styles.label}>Inicio</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} onPress={goToWardrobe} activeOpacity={0.7}>
        <Ionicons name="shirt-outline" size={24} color={colors.accent} />
        <Text style={styles.label}>Mi Colección</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 12,
    paddingHorizontal: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: colors.accent,
    marginTop: 4,
  },
});
