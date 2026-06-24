import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { Skeleton } from './Skeleton';

type LoadingOverlayProps = {
  visible: boolean;
  message: string;
};

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Skeleton width={120} height={10} />
          <Skeleton width={180} height={10} />
          <Skeleton width={150} height={10} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  box: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.elevated,
  },
  message: {
    marginTop: spacing.xs,
    fontSize: 15,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
