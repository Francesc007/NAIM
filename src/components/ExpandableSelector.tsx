import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { colors } from '../theme/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  label: string;
  options: readonly string[];
  value: string;
  onSelect: (value: string) => void;
  /** Controlado: si está expandido */
  expanded?: boolean;
  /** Llamado al tocar el header para expandir/colapsar */
  onToggle?: () => void;
};

export function ExpandableSelector({
  label,
  options,
  value,
  onSelect,
  expanded = false,
  onToggle,
}: Props) {
  const isControlled = onToggle !== undefined;
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expandedState = isControlled ? expanded : internalExpanded;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isControlled) {
      onToggle?.();
    } else {
      setInternalExpanded((e) => !e);
    }
  };

  const handleSelect = (option: string) => {
    onSelect(option);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isControlled) {
      onToggle?.(); // Cierra este selector (padre pone expandedId = null)
    } else {
      setInternalExpanded(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggle}
        activeOpacity={0.7}
      >
        <Text style={styles.label}>{label}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.selectedText}>{value}</Text>
          <Text style={styles.chevron}>{expandedState ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expandedState && (
        <View style={styles.optionsGrid}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.chip, value === option && styles.chipActive]}
              onPress={() => handleSelect(option)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  value === option && styles.chipTextActive,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outline + '50',
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.onSurface,
  },
  headerRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  selectedText: {
    fontSize: 14,
    color: colors.primary,
    textTransform: 'capitalize' as const,
  },
  chevron: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    marginLeft: 8,
  },
  optionsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginTop: 12,
    paddingHorizontal: 4,
    marginHorizontal: -4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.outline + '30',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.onSurface,
    textTransform: 'capitalize' as const,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
});
