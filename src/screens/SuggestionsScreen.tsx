import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGarments } from '../context/GarmentContext';
import { useWeather } from '../context/WeatherContext';
import { generateSuggestions, OutfitSuggestion } from '../services/suggestionEngine';
import { GarmentCard } from '../components/GarmentCard';
import { StackBottomNav } from '../components/StackBottomNav';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export function SuggestionsScreen() {
  const navigation = useNavigation();
  const { garments, markWorn } = useGarments();
  const { temp, condition } = useWeather();
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasTriedLoad, setHasTriedLoad] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [occasion, setOccasion] = useState('casual');
  const requestInProgress = useRef(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const DEBOUNCE_MS = 5000;

  const loadSuggestions = async () => {
    if (requestInProgress.current) return;
    if (Date.now() < cooldownUntil) return;
    requestInProgress.current = true;
    setCooldownUntil(Date.now() + DEBOUNCE_MS);
    setLoading(true);
    setApiError(null);
    try {
      const weather = temp !== null && condition ? { temp, condition } : undefined;
      const { suggestions: list, error } = await generateSuggestions(occasion, weather);
      setSuggestions(list);
      setApiError(error ?? null);
      setHasTriedLoad(true);
    } finally {
      setLoading(false);
      requestInProgress.current = false;
    }
  };

  const isCooldown = Date.now() < cooldownUntil;

  useEffect(() => {
    if (cooldownUntil <= 0) return;
    const remaining = cooldownUntil - Date.now();
    if (remaining <= 0) {
      setCooldownUntil(0);
      return;
    }
    const t = setTimeout(() => setCooldownUntil(0), remaining);
    return () => clearTimeout(t);
  }, [cooldownUntil]);

  const handleWorn = async (suggestion: OutfitSuggestion) => {
    for (const g of suggestion.garments) {
      await markWorn(g.id);
    }
    navigation.navigate('MainHome', { screen: 'Home' });
  };

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
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingTitle}>Tu stylist está trabajando</Text>
            <Text style={styles.loadingText}>Espera un momento...</Text>
          </View>
        </View>
      </Modal>

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
                  {o}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {suggestions.length === 0 ? (
          <View style={styles.centered}>
            {!hasTriedLoad ? (
              <>
                <Text style={styles.emptyTitle}>Genera tu outfit con IA</Text>
                <Text style={styles.emptySubtitle}>
                  Toca el botón para que el stylist te recomiende una combinación
                </Text>
                <TouchableOpacity
                  style={[styles.primaryButton, (loading || isCooldown) && styles.primaryButtonDisabled]}
                  onPress={loadSuggestions}
                  disabled={loading || isCooldown}
                >
                  <Text style={styles.primaryButtonText}>
                    {isCooldown ? 'Espera 5 seg...' : 'Generar sugerencia'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.emptyTitle}>
                  {apiError ? 'No se pudo generar' : 'Sin sugerencias'}
                </Text>
                {apiError ? (
                  <Text style={styles.errorText}>{apiError}</Text>
                ) : (
                  <Text style={styles.emptySubtitle}>
                    Añade más prendas e intenta de nuevo
                  </Text>
                )}
                <TouchableOpacity
                  style={[styles.primaryButton, (loading || isCooldown) && styles.primaryButtonDisabled]}
                  onPress={loadSuggestions}
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
          <View style={styles.result}>
            {apiError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{apiError}</Text>
              </View>
            ) : null}
            {suggestions.map((item, i) => (
              <View key={i} style={styles.card}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.outfitRow}
                >
                  {item.garments.map((g) => (
                    <GarmentCard
                      key={g.id}
                      garment={g}
                      size="small"
                      hideLabel
                      imageResizeMode="contain"
                    />
                  ))}
                </ScrollView>
                <Text style={styles.reasonText}>{item.reason}</Text>
                <TouchableOpacity
                  style={styles.wornButton}
                  onPress={() => handleWorn(item)}
                >
                  <Text style={styles.wornButtonText}>Me lo pongo</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.secondaryButton, (loading || isCooldown) && styles.primaryButtonDisabled]}
              onPress={loadSuggestions}
              disabled={loading || isCooldown}
            >
              <Text style={styles.secondaryButtonText}>
                {isCooldown ? 'Espera 5 seg...' : 'Otra sugerencia'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <StackBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: colors.surface,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  loadingTitle: {
    fontSize: 22,
    fontFamily: typography.fontFamily.light,
    letterSpacing: 0.5,
    color: colors.text,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.light,
    color: colors.onSurfaceVariant,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: typography.fontFamily.light,
    letterSpacing: 0.5,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.light,
    color: colors.onSurfaceVariant,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  errorBanner: {
    backgroundColor: colors.error + '20',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorBannerText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onPrimary,
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 16,
    marginHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.light,
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  filterRow: {
    padding: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onSurface,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.outline + '30',
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.onSurface,
  },
  chipTextActive: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onPrimary,
  },
  result: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  outfitRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingRight: 16,
  },
  reasonText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.italic,
    color: colors.onSurfaceVariant,
    marginBottom: 12,
  },
  wornButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  wornButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onPrimary,
    fontSize: 14,
  },
});
