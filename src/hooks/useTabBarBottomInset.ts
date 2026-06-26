import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme';

/** Altura típica de la barra de navegación Android (3 botones). */
const ANDROID_NAV_BAR_MIN = 40;
const ANDROID_EXTRA_OFFSET = 12;

/** Aire mínimo entre iconos/etiquetas y los botones o gestos del sistema. */
const TAB_BAR_CLEARANCE = spacing.xs;

export type TabBarLayout = {
  paddingBottom: number;
  marginBottom: number;
};

/**
 * Insets para tab bar / StackBottomNav.
 * En Android con botones nativos, safe-area suele devolver bottom=0.
 */
export function useTabBarLayout(): TabBarLayout {
  const { bottom } = useSafeAreaInsets();

  if (Platform.OS === 'android') {
    return {
      paddingBottom: Math.max(bottom, ANDROID_NAV_BAR_MIN) + ANDROID_EXTRA_OFFSET,
      marginBottom: 0,
    };
  }

  return {
    paddingBottom: Math.max(bottom, spacing.xxs) + TAB_BAR_CLEARANCE,
    marginBottom: 0,
  };
}

/** @deprecated Usar useTabBarLayout().paddingBottom */
export function useTabBarBottomInset(): number {
  return useTabBarLayout().paddingBottom;
}
