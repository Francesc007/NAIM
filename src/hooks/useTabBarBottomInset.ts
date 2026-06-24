import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme';

/** Altura típica de la barra de navegación Android (3 botones). */
const ANDROID_NAV_BAR_MIN = 48;
const ANDROID_EXTRA_OFFSET = 8;

/**
 * Inset inferior para tab bar / StackBottomNav.
 * En Android con botones nativos, safe-area suele devolver bottom=0.
 */
export function useTabBarBottomInset(): number {
  const { bottom } = useSafeAreaInsets();
  if (Platform.OS === 'android') {
    return Math.max(bottom, ANDROID_NAV_BAR_MIN) + ANDROID_EXTRA_OFFSET;
  }
  return Math.max(bottom, spacing.sm);
}
