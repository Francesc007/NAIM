import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme';

type SyncAccountHintProps = {
  onPressSync: () => void;
};

export function SyncAccountHint({ onPressSync }: SyncAccountHintProps) {
  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={onPressSync}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel="Sincronizar cuenta con email"
    >
      <LinearGradient
        colors={['rgba(255, 252, 249, 0.98)', 'rgba(251, 244, 239, 0.96)', 'rgba(255, 255, 255, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="mail-outline" size={16} color={colors.primaryVariant} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Respalda tu estilo</Text>
          <Text style={styles.subtitle}>
            Vincula tu email para conservar tus prendas y acceder desde cualquier dispositivo.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.primaryVariant} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 138, 0.45)',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 13,
    letterSpacing: 0.3,
    color: '#6B5344',
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
});
