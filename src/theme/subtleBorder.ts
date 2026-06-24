import { ViewStyle } from 'react-native';
import { colors } from './colors';

/** Borde cálido sutil con resplandor — Favoritos, Mi Colección, Sugerencias, etc. */
export const subtleBrightBorder: ViewStyle = {
  borderWidth: 1.5,
  borderColor: 'rgba(221, 190, 169, 0.85)',
  shadowColor: colors.primaryVariant,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.32,
  shadowRadius: 12,
  elevation: 5,
};
