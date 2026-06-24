import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  require('../../assets/hero/ropa.jpg'),
  require('../../assets/hero/t-shirt.jpg'),
];

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { garments, loading, refresh } = useGarments();
  const { userName, setUserName, isLoading: userLoading } = useUser();
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
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

  // Mostrar modal solo si no hay nombre Y no hay prendas (usuario nuevo)
  // Si ya tiene prendas (de Supabase), es usuario existente: no pedir nombre de nuevo
  React.useEffect(() => {
    if (userLoading) return;
    if (userName) {
      setShowNameModal(false);
      return;
    }
    if (garments.length > 0) {
      setShowNameModal(false);
      return;
    }
    setShowNameModal(true);
  }, [userLoading, userName, garments.length]);

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      await setUserName(trimmed);
      setShowNameModal(false);
      setNameInput('');
    }
  };

  const handleMockPress = () => {
    Alert.alert(
      'Próximamente',
      'Pronto podrás añadir prendas como esta.',
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  const displayName = userName || '';

  const [activeIndex, setActiveIndex] = useState(0);
  const opacityAnims = useRef(
    HERO_IMAGES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;
  const scaleAnims = useRef(HERO_IMAGES.map(() => new Animated.Value(1))).current;

  const runZoomAfterDelay = (index: number) => {
    scaleAnims[index].setValue(1.0);
    Animated.timing(scaleAnims[index], {
      toValue: 1.1,
      duration: 6000,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    runZoomAfterDelay(0);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % HERO_IMAGES.length;
        Animated.parallel([
          Animated.timing(opacityAnims[prev], {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnims[next], {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
        scaleAnims[prev].setValue(1);
        runZoomAfterDelay(next);
        return next;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [activeIndex]);

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
                  StyleSheet.absoluteFill,
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
          <TouchableOpacity
            style={styles.heroContent}
            onLongPress={() => {
              setShowNameModal(true);
              setNameInput(displayName);
            }}
            activeOpacity={1}
          >
            <View style={styles.heroTextWrapper}>
              <Text style={styles.heroTitle}>
                Hola{displayName ? ' ' : ''}
                {displayName ? (
                  <Text style={styles.heroUserName}>{displayName}</Text>
                ) : null}
                {displayName ? ',' : ''}
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

      {/* Modal de bienvenida - ¿Cómo te llamas? */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Cómo te llamas?</Text>
            <Text style={styles.modalSubtitle}>
              Personaliza tu experiencia
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Tu nombre"
              placeholderTextColor={colors.onSurfaceVariant}
              value={nameInput}
              onChangeText={setNameInput}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSaveName}
              disabled={!nameInput.trim()}
            >
              <Text style={styles.modalButtonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSkipButton}
              onPress={() => {
                setShowNameModal(false);
                setNameInput('');
              }}
            >
              <Text style={styles.modalSkipText}>Más tarde</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    fontFamily: typography.fontFamily.light,
    marginTop: 8,
    textAlign: 'center',
  },
  modalInput: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 16,
    fontSize: 16,
    color: colors.text,
    fontFamily: typography.fontFamily.regular,
  },
  modalButton: {
    marginTop: 24,
    paddingVertical: 16,
    backgroundColor: colors.accent,
    borderRadius: 28,
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 16,
  },
  modalSkipButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  modalSkipText: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.fontFamily.light,
    fontSize: 14,
  },
});
