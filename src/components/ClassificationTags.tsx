import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface ClassificationTagsProps {
  colors: string[];
  subcategory?: string;
}

export function ClassificationTags({ colors: garmentColors, subcategory }: ClassificationTagsProps) {
  if (garmentColors.length === 0 && !subcategory) return null;

  return (
    <View style={styles.container}>
      {subcategory ? (
        <View style={styles.chip}>
          <Text style={styles.chipText}>{subcategory}</Text>
        </View>
      ) : null}
      {garmentColors.map((c) => (
        <View key={c} style={styles.chip}>
          <Text style={styles.chipText}>{c}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: colors.accent + '40',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 13,
    color: colors.onSurface,
    textTransform: 'capitalize',
  },
});
