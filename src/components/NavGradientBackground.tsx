import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, premiumGradient } from '../theme';

type NavGradientBackgroundProps = {
  style?: StyleProp<ViewStyle>;
};

const GRADIENT_COLORS = premiumGradient?.colors ?? [
  colors.surfaceElevated,
  '#FBF4EF',
  colors.primaryMuted,
];

export function NavGradientBackground({ style }: NavGradientBackgroundProps) {
  return (
    <LinearGradient
      colors={[...GRADIENT_COLORS]}
      start={premiumGradient?.start ?? { x: 0, y: 0 }}
      end={premiumGradient?.end ?? { x: 1, y: 1 }}
      style={[StyleSheet.absoluteFillObject, style]}
    />
  );
}
