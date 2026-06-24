import { colors } from './colors';

/** Degradado premium compartido (Home CTA, headers, tab bar). */
export const premiumGradient = {
  colors: [colors.surfaceElevated, '#FBF4EF', colors.primaryMuted] as const,
  start: { x: 0, y: 0 } as const,
  end: { x: 1, y: 1 } as const,
};
