import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { colors, premiumGradient, shadows, spacing, typography } from '../theme';
import { useTabBarBottomInset } from '../hooks/useTabBarBottomInset';

const TAB_BAR_CONTENT_HEIGHT = 56;

export function StackBottomNav() {
  const navigation = useNavigation<any>();
  const bottomInset = useTabBarBottomInset();
  const androidLift = Platform.OS === 'android' ? spacing.xs : 0;

  const activeTab = useNavigationState((state) => {
    const mainRoute = state.routes.find((r) => r.name === 'MainHome');
    const tabState = mainRoute?.state as { index: number; routes: { name: string }[] } | undefined;
    if (!tabState?.routes?.length) return null;
    return tabState.routes[tabState.index]?.name ?? null;
  });

  const goToHome = () => {
    navigation.navigate('MainHome', { screen: 'Home' });
  };

  const goToAdd = () => {
    navigation.navigate('MainHome', { screen: 'Add' });
  };

  const goToWardrobe = () => {
    navigation.navigate('MainHome', { screen: 'Wardrobe' });
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          height: TAB_BAR_CONTENT_HEIGHT + bottomInset + androidLift,
          paddingBottom: bottomInset + androidLift,
          paddingTop: spacing.xs,
          marginBottom: Platform.OS === 'android' ? 2 : 0,
        },
      ]}
    >
      <LinearGradient
        colors={[...premiumGradient.colors]}
        start={premiumGradient.start}
        end={premiumGradient.end}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.container}>
        <TouchableOpacity style={styles.tab} onPress={goToHome} activeOpacity={0.7}>
          <Ionicons name="sparkles" size={24} color={colors.primaryVariant} />
          <Text style={[styles.label, activeTab === 'Home' && styles.labelActive]}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addTab} onPress={goToAdd} activeOpacity={0.85}>
          <View style={styles.addTabIcon}>
            <Ionicons name="add" size={28} color={colors.onPrimary} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={goToWardrobe} activeOpacity={0.7}>
          <Ionicons name="shirt-outline" size={24} color={colors.primaryVariant} />
          <Text style={[styles.label, activeTab === 'Wardrobe' && styles.labelActive]}>
            Mi Colección
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    overflow: 'visible',
    ...shadows.elevated,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  tab: {
    alignItems: 'center',
    flex: 1,
  },
  addTab: {
    alignItems: 'center',
    flex: 1,
  },
  addTabIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryVariant,
    ...shadows.card,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: typography.fontFamily.regular,
  },
  labelActive: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primaryVariant,
  },
});
