import React from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, naimButtons, radius, shadows, spacing, typography } from '../theme';

export type NaimDialogTone = 'success' | 'info' | 'warm';

export interface NaimDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  tone?: NaimDialogTone;
  primaryText?: string;
  secondaryText?: string;
  primaryDestructive?: boolean;
  onPrimary?: () => void;
  onSecondary?: () => void;
  onDismiss?: () => void;
}

const TONE_ACCENT: Record<NaimDialogTone, string> = {
  success: colors.primaryVariant,
  info: colors.primary,
  warm: colors.primaryVariant,
};

export function NaimDialog({
  visible,
  title,
  message = '',
  tone = 'warm',
  primaryText = 'Entendido',
  secondaryText,
  primaryDestructive = false,
  onPrimary,
  onSecondary,
  onDismiss,
}: NaimDialogProps) {
  const accent = TONE_ACCENT[tone];
  const hasMessage = message.trim().length > 0;
  const twoActions = Boolean(secondaryText);

  const close = () => onDismiss?.();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.cardOuter} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={['#FFFFFF', '#FBF4EF', '#F3E7DF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <Pressable style={[styles.accentBar, { backgroundColor: accent }]} />
            <Text style={[styles.title, !hasMessage && styles.titleOnly]}>{title}</Text>
            {hasMessage ? <Text style={styles.message}>{message}</Text> : null}

            <View style={[styles.actions, twoActions && styles.actionsRow]}>
              {secondaryText ? (
                <TouchableOpacity
                  style={[
                    naimButtons.secondary,
                    naimButtons.actionInRow,
                    naimButtons.actionCompact,
                  ]}
                  onPress={() => {
                    onSecondary?.();
                    close();
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[naimButtons.secondaryText, naimButtons.actionCompactSecondaryText]}
                    numberOfLines={1}
                  >
                    {secondaryText}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[
                  naimButtons.primary,
                  primaryDestructive && naimButtons.destructive,
                  twoActions ? [naimButtons.actionInRow, naimButtons.actionCompact] : naimButtons.primaryStandalone,
                ]}
                onPress={() => {
                  onPrimary?.();
                  close();
                }}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    naimButtons.primaryText,
                    primaryDestructive && naimButtons.destructiveText,
                    twoActions && naimButtons.actionCompactText,
                  ]}
                  numberOfLines={1}
                >
                  {primaryText}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(33, 37, 41, 0.42)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  cardOuter: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(221, 190, 169, 0.85)',
    overflow: 'hidden',
    ...shadows.elevated,
  },
  card: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  accentBar: {
    alignSelf: 'center',
    width: 40,
    height: 3,
    borderRadius: 2,
    marginBottom: spacing.md,
    opacity: 0.9,
  },
  title: {
    fontFamily: typography.fontFamily.vogue,
    fontSize: 22,
    letterSpacing: 1.5,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  titleOnly: {
    marginBottom: spacing.lg,
  },
  message: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  actions: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
});
