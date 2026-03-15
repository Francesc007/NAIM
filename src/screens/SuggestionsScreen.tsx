import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGarments } from '../context/GarmentContext';
import { generateSuggestions, OutfitSuggestion } from '../services/suggestionEngine';
import { GarmentCard } from '../components/GarmentCard';
import { StackBottomNav } from '../components/StackBottomNav';
import { colors } from '../theme/colors';

export function SuggestionsScreen() {
  const navigation = useNavigation();
  const { garments, markWorn } = useGarments();
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [occasion, setOccasion] = useState('casual');

  useEffect(() => {
    loadSuggestions();
  }, [occasion, garments.length]);

  const loadSuggestions = async () => {
    setLoading(true);
    const list = await generateSuggestions(occasion, 3);
    setSuggestions(list);
    setLoading(false);
  };

  const handleWorn = async (suggestion: OutfitSuggestion) => {
    for (const g of suggestion.garments) {
      await markWorn(g.id);
    }
    navigation.navigate('MainHome', { screen: 'Home' });
  };

  if (garments.length < 2) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>👔</Text>
          <Text style={styles.emptyTitle}>Necesitas al menos 2 prendas</Text>
          <Text style={styles.emptySubtitle}>
            Añade más prendas a tu guardarropa para recibir sugerencias de outfit
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('AddGarment' as never)}
          >
            <Text style={styles.primaryButtonText}>Añadir prenda</Text>
          </TouchableOpacity>
        </View>
        <StackBottomNav />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Generando sugerencias...</Text>
        </View>
        <StackBottomNav />
      </View>
    );
  }

  if (suggestions.length === 0) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>
            Añade más variedad de prendas
          </Text>
          <Text style={styles.emptySubtitle}>
            Necesitas tops y bottoms para generar combinaciones
          </Text>
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

      <FlatList
        data={suggestions}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.outfitRow}>
              {item.garments.map((g) => (
                <GarmentCard
                  key={g.id}
                  garment={g}
                  size="small"
                  hideLabel
                  imageResizeMode="contain"
                />
              ))}
            </View>
            <TouchableOpacity
              style={styles.wornButton}
              onPress={() => handleWorn(item)}
            >
              <Text style={styles.wornButtonText}>Me lo pongo</Text>
            </TouchableOpacity>
          </View>
        )}
      />
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 12,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  filterRow: {
    padding: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
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
    color: colors.onSurface,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  list: {
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
  },
  wornButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  wornButtonText: {
    color: colors.onPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
});
