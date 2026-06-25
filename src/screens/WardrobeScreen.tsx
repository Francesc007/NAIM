import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  SectionList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useGarments } from '../context/GarmentContext';
import { Garment } from '../types/garment';
import { GarmentDetailModal } from '../components/GarmentDetailModal';
import { WARDROBE_CATEGORY_ORDER } from '../config/categories';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import type { TabParamList } from '../navigation/types';

const PREVIEW_LIMIT = 5;

const EMPTY_WARDROBE_IMAGE = require('../../assets/empty/guardarropa-vacio.jpg');

type WardrobeSection = {
  title: string;
  data: Garment[];
};

function normalizeCategory(value: string): string {
  return (value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatCategoryTitle(category: string): string {
  if (!category) return 'Otros';
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function buildWardrobeSections(garments: Garment[]): WardrobeSection[] {
  const byCategory = new Map<string, Garment[]>();

  for (const garment of garments) {
    const key = normalizeCategory(garment.category || '');
    const list = byCategory.get(key) ?? [];
    list.push(garment);
    byCategory.set(key, list);
  }

  const knownKeys = new Set(WARDROBE_CATEGORY_ORDER.map((c) => normalizeCategory(c)));
  const sections: { title: string; data: Garment[] }[] = [];

  for (const category of WARDROBE_CATEGORY_ORDER) {
    const key = normalizeCategory(category);
    const items = byCategory.get(key);
    if (!items?.length) continue;
    sections.push({
      title: formatCategoryTitle(category),
      data: [...items].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    });
    byCategory.delete(key);
  }

  const remaining = [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b, 'es'));
  for (const [key, items] of remaining) {
    if (!items.length) continue;
    sections.push({
      title: knownKeys.has(key) ? formatCategoryTitle(key) : formatCategoryTitle(key || 'otros'),
      data: [...items].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    });
  }

  return sections;
}

export function WardrobeScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<TabParamList, 'Wardrobe'>>();
  const { garments, loading, refresh, updateGarment, deleteGarment } = useGarments();
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const listRef = useRef<SectionList<Garment>>(null);

  const allSections = useMemo(() => buildWardrobeSections(garments), [garments]);

  const displaySections = useMemo((): WardrobeSection[] => {
    if (expandedCategory) {
      const section = allSections.find((s) => s.title === expandedCategory);
      return section ? [section] : [];
    }
    return allSections.map((section) => ({
      title: section.title,
      data: section.data.slice(0, PREVIEW_LIMIT),
    }));
  }, [allSections, expandedCategory]);

  const getSectionTotalCount = useCallback(
    (title: string) => allSections.find((s) => s.title === title)?.data.length ?? 0,
    [allSections]
  );

  const highlightGarmentId = route.params?.highlightGarmentId;

  useEffect(() => {
    if (!highlightGarmentId || allSections.length === 0) return;

    const ownerSection = allSections.find((section) =>
      section.data.some((g) => g.id === highlightGarmentId)
    );
    if (!ownerSection) return;

    const fullIndex = ownerSection.data.findIndex((g) => g.id === highlightGarmentId);
    if (fullIndex < 0) return;

    if (fullIndex >= PREVIEW_LIMIT && expandedCategory !== ownerSection.title) {
      setExpandedCategory(ownerSection.title);
      return;
    }

    const sectionIndex = displaySections.findIndex((section) =>
      section.data.some((g) => g.id === highlightGarmentId)
    );
    if (sectionIndex < 0) return;

    const itemIndex = displaySections[sectionIndex].data.findIndex(
      (g) => g.id === highlightGarmentId
    );
    if (itemIndex < 0) return;

    setTimeout(() => {
      listRef.current?.scrollToLocation({
        sectionIndex,
        itemIndex,
        animated: true,
        viewOffset: 8,
      });
    }, 300);
  }, [highlightGarmentId, allSections, displaySections, expandedCategory]);

  const closeExpandedCategory = useCallback(() => {
    setExpandedCategory(null);
  }, []);

  const renderGarmentCard = useCallback(
    (item: Garment) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedGarment(item)}
        activeOpacity={0.8}
      >
        <View style={styles.thumb}>
          {item.imagePath ? (
            <Image source={{ uri: item.imagePath }} style={styles.thumbImage} resizeMode="cover" />
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
    ),
    []
  );

  if (garments.length === 0 && !loading) {
    return (
      <View style={styles.emptyRoot}>
        <ImageBackground source={EMPTY_WARDROBE_IMAGE} style={styles.emptyBackground} resizeMode="cover">
          <View style={styles.emptyOverlay}>
            <Text style={styles.emptyElegantText}>Tu clóset está esperando...</Text>
            <Text style={styles.emptySubtitle}>Añade tu primera prenda para empezar</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Add')}
            >
              <Text style={styles.primaryButtonText}>Añadir prenda</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <>
      <SectionList
        ref={listRef}
        key={expandedCategory ?? 'overview'}
        sections={displaySections}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={refresh}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {expandedCategory ? (
              <TouchableOpacity
                style={styles.closeCategoryBtn}
                onPress={closeExpandedCategory}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Cerrar categoría"
              >
                <Ionicons name="close" size={22} color={colors.primaryVariant} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}
        renderSectionFooter={({ section: { title } }) => {
          if (expandedCategory) return null;
          const total = getSectionTotalCount(title);
          if (total <= PREVIEW_LIMIT) return null;
          return (
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => setExpandedCategory(title)}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>Ver todas las prendas</Text>
            </TouchableOpacity>
          );
        }}
        renderItem={({ item }) => renderGarmentCard(item)}
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },
  closeCategoryBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  seeAllButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primaryVariant,
    letterSpacing: 0.3,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(221, 190, 169, 0.85)',
    shadowColor: colors.primaryVariant,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 5,
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
  emptyRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyBackground: {
    flex: 1,
    width: '100%',
  },
  emptyOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(255, 251, 247, 0.78)',
  },
  emptyElegantText: {
    fontSize: 22,
    color: '#5C4033',
    fontFamily: typography.fontFamily.semiBold,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8B5E3C',
    fontFamily: typography.fontFamily.regular,
    marginBottom: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
