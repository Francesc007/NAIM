import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, shadows, spacing } from '../../theme';
import { Skeleton } from './Skeleton';

export function SkeletonOutfitCard() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Skeleton width={112} height={12} />
        <Skeleton style={styles.headerLine} height={1} />
      </View>

      <View style={styles.row}>
        <Skeleton width={70} height={95} borderRadius={radius.lg} />
        <Skeleton width={70} height={95} borderRadius={radius.lg} />
        <Skeleton width={70} height={95} borderRadius={radius.lg} />
      </View>

      <Skeleton width="92%" style={styles.reason} />
      <Skeleton width="65%" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerLine: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  reason: {
    marginTop: spacing.xs,
  },
});
