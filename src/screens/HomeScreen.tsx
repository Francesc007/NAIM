import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useGarments } from '../context/GarmentContext';
import { useUser } from '../context/UserContext';
import { GarmentCard } from '../components/GarmentCard';
import { Skeleton } from '../components/ui/Skeleton';
import { colors, radius, shadows, spacing, subtleBrightBorder, typography } from '../theme';
import { MOCK_GARMENTS } from '../constants/mockData';
import type { TabParamList } from '../navigation/types';

type Nav = BottomTabNavigationProp<TabParamList, 'Home'>;

/** Multiplicadores de altura para efecto masonry */
const MASONRY_HEIGHTS = [1, 1.35, 1.1, 1.45, 1.2, 1.3, 1.05, 1.4, 1.15, 1.25];

/** Imágenes del Hero - crossfade infinito cada 6 segundos */
const HERO_IMAGES = [
  require('../../assets/hero/jeans.jpg'),
  require('../../assets/hero/guardarropa3.jpg'),
  require('../../assets/hero/ropa1.jpg'),
  require('../../assets/hero/guardarropa.jpg'),
  require('../../assets/hero/guardarropa2.jpg'),
];

const HERO_SCALE_FROM = 1;
const HERO_SCALE_TO = 1.08;
const HERO_SLIDE_MS = 6000;
const HERO_CROSSFADE_MS = 1800;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { garments, loading, refresh } = useGarments();
  const { userName } = useUser();
  const { width } = useWindowDimensions();
  const padding = 20;
  const gap = 12;
  const cardWidth = (width - padding * 2 - gap) / 2;
  const mockCardSize = 140;

  // Favoritos: solo 10 prendas más usadas (wearCount)
  const favorites = [...garments]
    .sort((a, b) => (b.wearCount ?? 0) - (a.wearCount ?? 0))
    .slice(0, 10);

  const leftColumn = favorites.filter((_, i) => i % 2 === 0);
  const rightColumn = favorites.filter((_, i) => i % 2 === 1);

  const handleMockPress = () => {
    Alert.alert(
      'Próximamente',
      'Pronto podrás añadir prendas como esta.',
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  const customName = userName?.trim() ?? '';
  const hasCustomName = customName.length > 0;

  const activeIndexRef = useRef(0);
  const opacityAnims = useRef(
    HERO_IMAGES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;
  const scaleAnims = useRef(HERO_IMAGES.map(() => new Animated.Value(HERO_SCALE_FROM))).current;

  const runHeroZoom = (index: number) => {
    scaleAnims[index].setValue(HERO_SCALE_FROM);
    Animated.timing(scaleAnims[index], {
      toValue: HERO_SCALE_TO,
      duration: HERO_SLIDE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const crossfadeToIndex = (next: number) => {
    const prev = activeIndexRef.current;
    if (prev === next) return;

    scaleAnims[next].setValue(HERO_SCALE_FROM);
    opacityAnims[next].setValue(0);

    Animated.parallel([
      Animated.timing(opacityAnims[prev], {
        toValue: 0,
        duration: HERO_CROSSFADE_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnims[next], {
        toValue: 1,
        duration: HERO_CROSSFADE_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      scaleAnims[prev].stopAnimation();
      scaleAnims[prev].setValue(HERO_SCALE_FROM);
    });

    runHeroZoom(next);
    activeIndexRef.current = next;
  };

  useEffect(() => {
    runHeroZoom(0);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (activeIndexRef.current + 1) % HERO_IMAGES.length;
      crossfadeToIndex(next);
    }, HERO_SLIDE_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.accent} />
        }
      >
        {/* Hero Section - Capas con crossfade y escala premium */}
        <View style={styles.heroContainer}>
          <View style={styles.heroImageWrapper}>
            {HERO_IMAGES.map((img, index) => (
              <Animated.Image
                key={index}
                source={img}
                style={[
                  styles.heroImageLayer,
                  {
                    opacity: opacityAnims[index],
                    transform: [{ scale: scaleAnims[index] }],
                  },
                ]}
                resizeMode="cover"
              />
            ))}
            <View style={[StyleSheet.absoluteFill, styles.heroOverlay]} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.5)']}
              style={styles.heroTextGradient}
              locations={[0.3, 1]}
            />
          </View>
          <TouchableOpacity style={styles.heroContent} activeOpacity={1}>
            <View style={styles.heroTextWrapper}>
              <Text style={styles.heroTitle}>
                {hasCustomName ? (
                  <>
                    Hola <Text style={styles.heroUserName}>{customName}</Text>,
                  </>
                ) : (
                  'Hola'
                )}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Acción principal */}
        <TouchableOpacity
          style={styles.suggestionCard}
          onPress={() => navigation.navigate('Suggestions')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.surfaceElevated, '#FBF4EF', colors.primaryMuted]}
            style={styles.suggestionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.suggestionContent}>
              <Text style={styles.suggestionTitle}>
                Descubre tu outfit ideal para hoy
              </Text>
              <Text style={styles.suggestionSubtitle}>
                {garments.length === 0 ? (
                  'Añade prendas para recibir sugerencias'
                ) : (
                  <Text style={styles.suggestionWardrobeCount}>
                    {`Tienes ${garments.length} prendas en tu guardarropa`}
                  </Text>
                )}
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Favoritos - solo 10 prendas más usadas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favoritos</Text>

          {loading ? (
            <View style={styles.masonry}>
              <View style={styles.column}>
                <View style={[styles.skeletonCard, { width: cardWidth }]}>
                  <Skeleton height={160} borderRadius={radius.lg} />
                  <Skeleton style={styles.skeletonLabel} height={12} />
                </View>
                <View style={[styles.skeletonCard, { width: cardWidth }]}>
                  <Skeleton height={180} borderRadius={radius.lg} />
                  <Skeleton style={styles.skeletonLabel} height={12} />
                </View>
              </View>
              <View style={styles.column}>
                <View style={[styles.skeletonCard, { width: cardWidth }]}>
                  <Skeleton height={180} borderRadius={radius.lg} />
                  <Skeleton style={styles.skeletonLabel} height={12} />
                </View>
                <View style={[styles.skeletonCard, { width: cardWidth }]}>
                  <Skeleton height={160} borderRadius={radius.lg} />
                  <Skeleton style={styles.skeletonLabel} height={12} />
                </View>
              </View>
            </View>
          ) : favorites.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyElegantText}>
                Tu clóset está esperando...
              </Text>
              <Text style={styles.emptySubtitle}>
                Añade prendas para ver tus favoritos
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('Add')}
              >
                <Text style={styles.primaryButtonText}>Añadir prenda</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.masonry}>
              <View style={styles.column}>
                {leftColumn.map((g, i) => (
                  <GarmentCard
                    key={g.id}
                    garment={g}
                    size="medium"
                    width={cardWidth}
                    heightMultiplier={MASONRY_HEIGHTS[i % MASONRY_HEIGHTS.length]}
                    showSubtleBorder
                    onPress={() =>
                      navigation.navigate('Wardrobe', { highlightGarmentId: g.id })
                    }
                  />
                ))}
              </View>
              <View style={styles.column}>
                {rightColumn.map((g, i) => (
                  <GarmentCard
                    key={g.id}
                    garment={g}
                    size="medium"
                    width={cardWidth}
                    heightMultiplier={MASONRY_HEIGHTS[(i + 1) % MASONRY_HEIGHTS.length]}
                    showSubtleBorder
                    onPress={() =>
                      navigation.navigate('Wardrobe', { highlightGarmentId: g.id })
                    }
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Inspiración */}
        <View style={styles.mockSection}>
          <Text style={styles.sectionTitle}>Inspiración</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mockScroll}
          >
            {MOCK_GARMENTS.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.mockCard, { width: mockCardSize, marginLeft: idx > 0 ? 12 : 0 }]}
                onPress={handleMockPress}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.mockImage}
                  resizeMode="cover"
                />
                <Text style={styles.mockLabel} numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  heroContainer: {
    height: 240,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  heroImageWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  heroImageLayer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  heroTextGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  heroContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: spacing.xl,
    paddingBottom: 28,
  },
  heroTextWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.vogue,
    letterSpacing: 2,
    lineHeight: 36,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroUserName: {
    fontFamily: typography.fontFamily.vogue,
    fontSize: 30,
    letterSpacing: 2,
    lineHeight: 38,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroSubtitle: {
    fontSize: 17,
    color: '#FFFFFF',
    marginTop: 8,
    fontFamily: typography.fontFamily.vogue,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  suggestionCard: {
    marginHorizontal: spacing.lg,
    marginBottom: 28,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...subtleBrightBorder,
  },
  suggestionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 17,
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
    letterSpacing: 0.5,
  },
  suggestionSubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    fontFamily: typography.fontFamily.light,
  },
  suggestionWardrobeCount: {
    fontSize: 14,
    color: colors.primaryVariant,
    fontFamily: typography.fontFamily.semiBold,
  },
  arrow: {
    fontSize: 28,
    color: colors.accent,
    fontFamily: typography.fontFamily.light,
    marginLeft: 12,
  },
  mockSection: {
    marginTop: 32,
    marginBottom: 28,
    paddingHorizontal: spacing.lg,
  },
  mockScroll: {
    paddingHorizontal: 0,
    flexDirection: 'row',
    paddingRight: spacing.xxl,
  },
  mockCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    ...subtleBrightBorder,
  },
  mockImage: {
    width: '100%',
    height: 160,
  },
  mockLabel: {
    padding: 12,
    fontSize: 11,
    color: '#000000',
    fontFamily: typography.fontFamily.semiBold,
    letterSpacing: 0.2,
    textAlign: 'center',
    backgroundColor: colors.primaryMuted,
  },
  masonry: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
    letterSpacing: 1,
    marginBottom: 20,
    marginHorizontal: 0,
  },
  skeletonCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  skeletonLabel: {
    marginTop: spacing.xs,
    marginBottom: spacing.xxs,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyElegantText: {
    fontSize: 22,
    color: colors.text,
    fontFamily: typography.fontFamily.light,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 8,
    fontFamily: typography.fontFamily.light,
    letterSpacing: 0.5,
  },
  primaryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: colors.accent,
    borderRadius: 28,
  },
  primaryButtonText: {
    color: colors.text,
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
  },
});
