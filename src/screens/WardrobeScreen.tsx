import React, { useState, useRef, useEffect } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useGarments } from '../context/GarmentContext';
import { Garment } from '../types/garment';
import { GarmentDetailModal } from '../components/GarmentDetailModal';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import type { TabParamList } from '../navigation/types';

export function WardrobeScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<TabParamList, 'Wardrobe'>>();
  const { garments, loading, refresh, updateGarment, deleteGarment } = useGarments();
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const listRef = useRef<FlatList>(null);

  const highlightGarmentId = route.params?.highlightGarmentId;

  useEffect(() => {
    if (highlightGarmentId && garments.length > 0) {
      const index = garments.findIndex((g) => g.id === highlightGarmentId);
      if (index >= 0) {
        setTimeout(() => {
          listRef.current?.scrollToIndex({ index, animated: true });
        }, 300);
      }
    }
  }, [highlightGarmentId, garments]);

  if (garments.length === 0 && !loading) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Text style={styles.emptyEmoji}>👔</Text>
        <Text style={styles.emptyElegantText}>Tu clóset está esperando...</Text>
        <Text style={styles.emptySubtitle}>Añade tu primera prenda para empezar</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Add')}
        >
          <Text style={styles.primaryButtonText}>Añadir prenda</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <FlatList
        ref={listRef}
        data={garments}
        keyExtractor={(item) => item.id}
        onScrollToIndexFailed={() => {}}
        refreshing={loading}
        onRefresh={refresh}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setSelectedGarment(item)}
            activeOpacity={0.8}
          >
          <View style={styles.thumb}>
            {item.imagePath ? (
              <Image
                source={{ uri: item.imagePath }}
                style={styles.thumbImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.thumbPlaceholder}>
                <Text style={styles.thumbEmoji}>📷</Text>
              </View>
            )}
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.category} · {item.occasion}
            </Text>
          </View>
          </TouchableOpacity>
        )}
      />
      <GarmentDetailModal
        garment={selectedGarment}
        visible={!!selectedGarment}
        onClose={() => setSelectedGarment(null)}
        onSave={updateGarment}
        onDelete={deleteGarment}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 120,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.outline + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbEmoji: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onSurface,
  },
  meta: {
    fontSize: 14,
    fontFamily: typography.fontFamily.light,
    color: colors.onSurfaceVariant,
    marginTop: 4,
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
  emptyElegantText: {
    fontSize: 22,
    color: colors.text,
    fontFamily: typography.fontFamily.light,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.onSurfaceVariant,
    fontFamily: typography.fontFamily.light,
    marginBottom: 24,
  },
  primaryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onPrimary,
    fontSize: 16,
  },
});
