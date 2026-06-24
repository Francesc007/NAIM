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
import { colors, radius, spacing, typography } from '../theme';

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
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onSurface,
  },
  headerRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  selectedText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
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
    marginTop: spacing.sm,
    paddingHorizontal: 4,
    marginHorizontal: -4,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryVariant,
  },
  chipText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.onSurface,
    textTransform: 'capitalize' as const,
  },
  chipTextActive: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onPrimary,
  },
});
