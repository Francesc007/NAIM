import React, { useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Garment } from '../types/garment';
import { colors, radius, shadows, spacing, subtleBrightBorder, typography } from '../theme';

interface GarmentCardProps {
  garment: Garment;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  /** Ancho fijo (para masonry). Si no se pasa, usa size. */
  width?: number;
  /** Multiplicador de altura para layout masonry (ej: 1, 1.2, 1.4) */
  heightMultiplier?: number;
  /** Ocultar el nombre de la prenda (solo imagen) */
  hideLabel?: boolean;
  /** resizeMode para la imagen: 'cover' o 'contain' */
  imageResizeMode?: 'cover' | 'contain';
  /** Borde sutil brillante (Favoritos / Mi Colección) */
  showSubtleBorder?: boolean;
}

export function GarmentCard({
  garment,
  onPress,
  size = 'medium',
  width: customWidth,
  heightMultiplier = 1,
  hideLabel = false,
  imageResizeMode = 'cover',
  showSubtleBorder = false,
}: GarmentCardProps) {
  const baseDim = size === 'small' ? 60 : size === 'large' ? 120 : 100;
  const width = customWidth ?? baseDim;
  const height = width * 1.4 * heightMultiplier;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.92,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={{ width, marginBottom: spacing.sm }}
    >
      <Animated.View
        style={[
          styles.container,
          showSubtleBorder && styles.subtleBorder,
          {
            width,
            height,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={styles.imageContainer}>
          {garment.imagePath ? (
            <Image
              source={{ uri: garment.imagePath }}
              style={styles.image}
              resizeMode={imageResizeMode}
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>📷</Text>
            </View>
          )}
        </View>
        {!hideLabel && (
          <View style={styles.nameContainer}>
            <Text style={styles.name} numberOfLines={2}>
              {garment.name}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  subtleBorder: subtleBrightBorder,
  imageContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 28,
  },
  nameContainer: {
    padding: spacing.xs,
    paddingTop: 6,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 11,
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
