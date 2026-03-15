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
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { MOCK_GARMENTS } from '../constants/mockData';
import type { TabParamList } from '../navigation/types';

type Nav = BottomTabNavigationProp<TabParamList, 'Home'>;

/** Padding inferior para que el FAB no tape contenido */
const FAB_BOTTOM_PADDING = 120;

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

  // Mostrar modal al cargar si no hay nombre guardado
  React.useEffect(() => {
    if (!userLoading && !userName) {
      setShowNameModal(true);
    }
  }, [userLoading, userName]);

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
              <Text style={styles.heroSubtitle}>
                Tu Asistente Personal de Estilo
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Sugerencias con gradiente */}
        <TouchableOpacity
          style={styles.suggestionCard}
          onPress={() => navigation.navigate('Suggestions')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FFFFFF', '#FBF4EF', '#F5E6DC']}
            style={styles.suggestionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.suggestionContent}>
              <Text style={styles.suggestionTitle}>
                Descubre tu outfit ideal para hoy
              </Text>
              <Text style={styles.suggestionSubtitle}>
                {garments.length === 0
                  ? 'Añade prendas para recibir sugerencias'
                  : `Tienes ${garments.length} prendas en tu guardarropa`}
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </LinearGradient>
        </TouchableOpacity>

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

        {/* Favoritos - solo 10 prendas más usadas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favoritos</Text>

          {favorites.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyElegantText}>
                Tu clóset está esperando...
              </Text>
              <Text style={styles.emptySubtitle}>
                Añade prendas para ver tus favoritos
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('AddGarment')}
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
                    onPress={() =>
                      navigation.navigate('Wardrobe', { highlightGarmentId: g.id })
                    }
                  />
                ))}
              </View>
            </View>
          )}
        </View>
        <View style={{ height: FAB_BOTTOM_PADDING }} />
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
    paddingBottom: 24,
  },
  heroContainer: {
    height: 240,
    marginBottom: 24,
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
    padding: 24,
    paddingBottom: 28,
  },
  heroTextWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 1.2,
    lineHeight: 36,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroUserName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 32,
    letterSpacing: 1.2,
    lineHeight: 40,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 8,
    fontFamily: typography.fontFamily.italic,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  suggestionCard: {
    marginHorizontal: 20,
    marginBottom: 28,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  suggestionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
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
  arrow: {
    fontSize: 28,
    color: colors.accent,
    fontFamily: typography.fontFamily.light,
    marginLeft: 12,
  },
  mockSection: {
    marginTop: 32,
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  mockScroll: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    paddingRight: 32,
  },
  mockCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
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
    backgroundColor: colors.accent + '25',
  },
  masonry: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
    letterSpacing: 1,
    marginBottom: 20,
    marginHorizontal: 0,
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
  masonry: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
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
