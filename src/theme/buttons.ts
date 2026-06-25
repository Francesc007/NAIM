import type { TextStyle, ViewStyle } from 'react-native';
import { colors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

/**
 * Botones NAIM — estándar del design system.
 * Forma: rectangulares con esquinas redondas (`radius.md`, 12px).
 * Usar en modales, diálogos (NaimDialog), formularios y acciones principales.
 */
export const naimButtons = {
  primary: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.primaryVariant,
    ...shadows.card,
  } satisfies ViewStyle,

  primaryText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 16,
    color: colors.onPrimary,
    letterSpacing: 0.3,
  } satisfies TextStyle,

  secondary: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  } satisfies ViewStyle,

  secondaryText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  } satisfies TextStyle,

  muted: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: `${colors.primaryVariant}66`,
  } satisfies ViewStyle,

  mutedText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 15,
    color: colors.primaryVariant,
    letterSpacing: 0.2,
  } satisfies TextStyle,

  destructive: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.error,
  } satisfies ViewStyle,

  destructiveText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 15,
    color: colors.error,
    letterSpacing: 0.2,
  } satisfies TextStyle,

  /** Botón único centrado en modal (sin ocupar fila completa). */
  primaryStandalone: {
    alignSelf: 'center',
    minWidth: 160,
    paddingHorizontal: spacing.xl,
  } satisfies ViewStyle,

  /** Variante en fila de dos acciones dentro de modal/diálogo. */
  actionInRow: {
    flex: 1,
    minWidth: 0,
  } satisfies ViewStyle,

  /** Variante compacta en fila de dos acciones (evita salto de línea). */
  actionCompact: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
  } satisfies ViewStyle,

  actionCompactText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
    letterSpacing: 0.1,
  } satisfies TextStyle,

  actionCompactSecondaryText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    letterSpacing: 0.1,
  } satisfies TextStyle,
} as const;
