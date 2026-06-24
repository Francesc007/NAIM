import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGarments } from '../context/GarmentContext';
import { useWeather } from '../context/WeatherContext';
import { generateSuggestions, OutfitSuggestion } from '../services/suggestionEngine';
import { GarmentCard } from '../components/GarmentCard';
import { StackBottomNav } from '../components/StackBottomNav';
import { SkeletonOutfitCard } from '../components/ui/SkeletonOutfitCard';
import { colors, radius, shadows, spacing, subtleBrightBorder, typography } from '../theme';

function formatOccasionLabel(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isInventoryHint(error: string | null): boolean {
  if (!error) return false;
  return (
    error.includes('No hay prendas válidas') ||
    error.includes('No tienes prendas para ocasión')
  );
}

function isGroqFallbackHint(error: string | null): boolean {
  if (!error) return false;
  return error.includes('sugerencias guardadas');
}

function isInfoHint(error: string | null): boolean {
  return isInventoryHint(error) || isGroqFallbackHint(error);
}

export function SuggestionsScreen() {
  const navigation = useNavigation();
  const { width: screenWidth } = useWindowDimensions();
  const { garments, markWorn } = useGarments();
  const { temp, condition } = useWeather();
  const weatherRef = useRef({ temp, condition });
  weatherRef.current = { temp, condition };
  const garmentsRef = useRef(garments);
  garmentsRef.current = garments;
  
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasTriedLoad, setHasTriedLoad] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [occasion, setOccasion] = useState('casual');
  const [activeIndex, setActiveIndex] = useState(0);
  const requestInProgress = useRef(false);
  const suggestionsRef = useRef<OutfitSuggestion[]>([]);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const cooldownUntilRef = useRef(0);
  const DEBOUNCE_MS = 5000;

  suggestionsRef.current = suggestions;

  const loadSuggestions = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (requestInProgress.current) return;

      if (opts?.refresh) {
        if (Date.now() < cooldownUntilRef.current) return;
        const until = Date.now() + DEBOUNCE_MS;
        cooldownUntilRef.current = until;
        setCooldownUntil(until);
        setSuggestions([]);
        console.log('0. Botón presionado: Ejecutando setSuggestions([]) y mezclando con Fisher-Yates');
      }

      requestInProgress.current = true;
      setLoading(true);
      setApiError(null);

      try {
        const w = weatherRef.current;
        const weather =
          w.temp !== null && w.condition ? { temp: w.temp, condition: w.condition } : undefined;

        const totalInventory = [...garmentsRef.current];
        if (opts?.refresh) {
          for (let i = totalInventory.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [totalInventory[i], totalInventory[j]] = [totalInventory[j], totalInventory[i]];
          }
        }

        const { suggestions: list, error } = await generateSuggestions(occasion, weather, {
          variationIndex: opts?.refresh ? Math.floor(Math.random() * 10) : 0,
          forceRefresh: Boolean(opts?.refresh),
          garmentsOverride: opts?.refresh ? totalInventory : undefined,
        });

        setSuggestions(list);
        setActiveIndex(0);
        setApiError(error ?? null);
        setHasTriedLoad(true);
      } catch {
        setApiError('Error al conectar con el Stylist');
      } finally {
        setLoading(false);
        requestInProgress.current = false;
      }
    },
    [occasion]
  );

  useEffect(() => {
    if (garments.length < 1) return;
    loadSuggestions();
  }, [occasion, garments.length, loadSuggestions]);

  const isCooldown = Date.now() < cooldownUntil;

  useEffect(() => {
    if (cooldownUntil <= 0) return;
    const remaining = cooldownUntil - Date.now();
    if (remaining <= 0) {
      setCooldownUntil(0);
      cooldownUntilRef.current = 0;
      return;
    }
    const t = setTimeout(() => {
      setCooldownUntil(0);
      cooldownUntilRef.current = 0;
    }, remaining);
    return () => clearTimeout(t);
  }, [cooldownUntil]);

  const handleWorn = async (suggestion: OutfitSuggestion) => {
    for (const g of suggestion.garments) {
      await markWorn(g.id);
    }
    navigation.navigate('MainHome', { screen: 'Home' });
  };

  const handleNextOption = () => {
    if (suggestions.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % suggestions.length);
  };

  const activeSuggestion = suggestions[activeIndex];
  const cardsPerRow = 3;
  const horizontalPadding = spacing.md * 2;
  const cardHorizontalPadding = spacing.lg * 2;
  const cardsGap = spacing.xs * (cardsPerRow - 1);
  const optionCardWidth = Math.max(
    86,
    Math.floor((screenWidth - horizontalPadding - cardHorizontalPadding - cardsGap) / cardsPerRow)
  );

  if (garments.length < 1) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>👔</Text>
          <Text style={styles.emptyTitle}>Necesitas al menos 1 prenda</Text>
          <Text style={styles.emptySubtitle}>
            Añade más prendas a tu guardarropa para recibir sugerencias de outfit
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('MainHome', { screen: 'Add' })}
          >
            <Text style={styles.primaryButtonText}>Añadir prenda</Text>
          </TouchableOpacity>
        </View>
        <StackBottomNav />
      </View>
    );
  }

  const occasions = ['casual', 'formal', 'deportivo', 'trabajo', 'ocasión especial'];

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Ocasión:</Text>
          <View style={styles.chips}>
            {occasions.map((o) => (
              <TouchableOpacity
                key={o}
                style={[styles.chip, occasion === o && styles.chipActive]}
                onPress={() => setOccasion(o)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.chipText,
                    occasion === o && styles.chipTextActive,
                  ]}
                >
                  {formatOccasionLabel(o)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading && suggestions.length === 0 ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingTitle}>Tu Stylist está preparando opciones para ti...</Text>
            <SkeletonOutfitCard />
          </View>
        ) : suggestions.length === 0 ? (
          <View style={styles.centered}>
            {!hasTriedLoad ? (
              <Text style={styles.emptySubtitle}>Cargando ideas de estilo…</Text>
            ) : (
              <>
                <Text style={styles.emptyTitle}>
                  {apiError
                    ? isInfoHint(apiError)
                      ? 'Sin combinaciones para esta ocasión'
                      : 'No se pudo generar'
                    : 'Sin sugerencias'}
                </Text>
                {apiError ? (
                  <Text
                    style={isInfoHint(apiError) ? styles.infoText : styles.errorText}
                  >
                    {apiError}
                  </Text>
                ) : (
                  <Text style={styles.emptySubtitle}>
                    Añade más prendas e intenta de nuevo
                  </Text>
                )}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    (loading || isCooldown) && styles.primaryButtonDisabled,
                  ]}
                  onPress={() => loadSuggestions({ refresh: true })}
                  disabled={loading || isCooldown}
                >
                  <Text style={styles.primaryButtonText}>
                    {isCooldown ? 'Espera 5 seg...' : 'Reintentar'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {apiError ? (
              <View
                style={isInfoHint(apiError) ? styles.infoBanner : styles.errorBanner}
              >
                <Text
                  style={
                    isInfoHint(apiError) ? styles.infoBannerText : styles.errorBannerText
                  }
                >
                  {apiError}
                </Text>
              </View>
            ) : null}
            {activeSuggestion ? (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.optionLabel}>
                    Opción {activeIndex + 1} de {suggestions.length}
                  </Text>
                  <View style={styles.cardAccent} />
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.outfitRow}
                >
                  {activeSuggestion.garments.map((g) => (
                    <GarmentCard
                      key={g.id}
                      garment={g}
                      width={optionCardWidth}
                      hideLabel
                      imageResizeMode="contain"
                    />
                  ))}
                </ScrollView>
                <Text style={styles.reasonText}>{activeSuggestion.reason}</Text>
              </View>
            ) : null}

            {suggestions.length > 1 ? (
              <TouchableOpacity
                style={styles.nextOptionButton}
                onPress={handleNextOption}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.nextOptionButtonText}>Ver otra opción</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                (loading || isCooldown) && styles.primaryButtonDisabled,
              ]}
              onPress={() => loadSuggestions({ refresh: true })}
              disabled={loading || isCooldown}
            >
              <Text style={styles.secondaryButtonText}>
                {isCooldown ? 'Espera 5 seg...' : '✨ Tres opciones nuevas'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
      <StackBottomNav />
    </View>
  );
}

// ... (los estilos se mantienen igual que tu código original)
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  loadingState: { paddingHorizontal: spacing.md, gap: spacing.md },
  loadingTitle: { fontSize: 16, fontFamily: typography.fontFamily.regular, letterSpacing: 0.2, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.sm },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  emptyEmoji: { fontSize: 80, marginBottom: spacing.xl },
  emptyTitle: { fontSize: 22, fontFamily: typography.fontFamily.light, letterSpacing: 0.5, color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  emptySubtitle: { fontSize: 15, fontFamily: typography.fontFamily.light, color: colors.onSurfaceVariant, marginBottom: spacing.xl, textAlign: 'center' },
  errorText: { fontSize: 14, fontFamily: typography.fontFamily.regular, color: colors.error, marginTop: 12, textAlign: 'center', paddingHorizontal: 16 },
  infoText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.light,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: 22,
  },
  errorBanner: { backgroundColor: colors.error + '20', padding: spacing.sm, marginBottom: spacing.sm, borderRadius: radius.sm },
  errorBannerText: { fontSize: 14, fontFamily: typography.fontFamily.regular, color: colors.error, textAlign: 'center' },
  infoBanner: {
    backgroundColor: colors.primaryMuted,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryVariant + '55',
  },
  infoBannerText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 21,
  },
  primaryButton: { marginTop: spacing.xl, paddingHorizontal: spacing.xl, paddingVertical: 14, backgroundColor: colors.primary, borderRadius: radius.md },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { fontFamily: typography.fontFamily.semiBold, color: colors.onPrimary, fontSize: 16 },
  secondaryButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primaryVariant,
    ...shadows.elevated,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  filterRow: { padding: spacing.md },
  filterLabel: { fontSize: 16, fontFamily: typography.fontFamily.semiBold, color: colors.onSurface, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center', alignSelf: 'center' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryVariant,
    ...shadows.elevated,
  },
  chipText: { fontSize: 14, fontFamily: typography.fontFamily.regular, color: colors.onSurface },
  chipTextActive: { fontFamily: typography.fontFamily.semiBold, color: colors.onPrimary },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...subtleBrightBorder,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  optionLabel: { fontSize: 13, fontFamily: typography.fontFamily.semiBold, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.onSurfaceVariant },
  cardAccent: { flex: 1, height: 1, backgroundColor: colors.accent + '55' },
  outfitRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm, minWidth: '100%', justifyContent: 'space-between' },
  reasonText: { fontSize: 15, fontFamily: typography.fontFamily.italic, color: colors.onSurfaceVariant, marginBottom: spacing.xs, lineHeight: 22 },
  nextOptionButton: {
    marginTop: spacing.xs,
    marginBottom: spacing.xxs,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryVariant,
    ...shadows.elevated,
  },
  nextOptionButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 16,
    color: colors.onPrimary,
    letterSpacing: 0.3,
  },
  wornButton: { backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  wornButtonText: { fontFamily: typography.fontFamily.semiBold, color: colors.onPrimary, fontSize: 14 },
});