import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useWeather } from '../context/WeatherContext';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { APP_NAME } from '../constants/mockData';

/** Iconos estilo Google Weather — emojis coloridos */
const WEATHER_EMOJIS: Record<string, string> = {
  '01d': '☀️',
  '01n': '🌙',
  '02d': '⛅',
  '02n': '☁️',
  '03d': '☁️',
  '03n': '☁️',
  '04d': '☁️',
  '04n': '☁️',
  '09d': '🌧️',
  '09n': '🌧️',
  '10d': '🌦️',
  '10n': '🌧️',
  '11d': '⛈️',
  '11n': '⛈️',
  '13d': '❄️',
  '13n': '❄️',
  '50d': '🌫️',
  '50n': '🌫️',
};

/** Degradado más marcado para el modal de clima */
const WEATHER_MODAL_GRADIENT = ['#FFFFFF', '#F7EBE2', '#EFD9C8', '#DDBEA9'] as const;

export function HomeHeader() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { greeting, temp, icon, loading, locationError, apiError } = useWeather();
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const titleSize = Math.min(30, Math.max(22, Math.floor(width * 0.07) + 2));
  const weatherEmoji = icon ? (WEATHER_EMOJIS[icon] ?? '🌡️') : '🌡️';
  const isSunIcon = icon === '01d';
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    if (!modalVisible) {
      rotateLoopRef.current?.stop();
      pulseLoopRef.current?.stop();
      rotateAnim.stopAnimation();
      pulseAnim.stopAnimation();
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
      return;
    }

    if (isSunIcon) {
      rotateAnim.setValue(0);
      rotateLoopRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 14500,
          useNativeDriver: true,
        })
      );
      rotateLoopRef.current.start();
      return;
    }

    pulseAnim.setValue(1);
    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoopRef.current.start();
  }, [isSunIcon, modalVisible, pulseAnim, rotateAnim]);

  const openModal = () => {
    if (!greeting && temp === null) return;
    setModalVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const showWeather = !loading && !locationError && (temp !== null || icon !== null || greeting !== null);
  const openSettings = () => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('Settings' as never);
      return;
    }
    navigation.navigate('Settings' as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.leftColumn} />
        <View style={styles.centerColumn} pointerEvents="box-none">
          <Text style={[styles.title, { fontSize: titleSize, lineHeight: titleSize * 1.25 }]} allowFontScaling={false}>
            {APP_NAME}
          </Text>
          <Text style={styles.subtitle}>Tu Estilo Inteligente</Text>
        </View>
        <View style={styles.rightColumn} pointerEvents="box-none">
          {loading ? (
            <View style={styles.weatherChipLoading}>
              <ActivityIndicator size="small" color={colors.primaryVariant} />
              <Text style={styles.weatherLoadingTemp}>--°</Text>
            </View>
          ) : showWeather ? (
            <TouchableOpacity
              style={styles.weatherChip}
              onPress={openModal}
              activeOpacity={0.7}
            >
              <Text style={styles.weatherEmoji}>{weatherEmoji}</Text>
              {temp !== null && (
                <Text style={styles.tempText}>{Math.round(temp)}°</Text>
              )}
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={openSettings}
            activeOpacity={0.75}
          >
            <Ionicons name="settings-outline" size={18} color={colors.primaryVariant} />
          </TouchableOpacity>
        </View>
      </View>
      {(locationError || apiError) && (
        <Text style={styles.errorText} numberOfLines={2}>
          {locationError ?? apiError}
        </Text>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.modalBackdrop, { opacity: fadeAnim }]} />
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCardOuter}>
              <View style={styles.modalGlowRing}>
                <LinearGradient
                  colors={[...WEATHER_MODAL_GRADIENT]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalCard}
                >
                  <View style={styles.modalAccentBar} />
                  <View style={styles.weatherInfoBox}>
                    <Animated.Text
                      style={[
                        styles.modalEmoji,
                        isSunIcon
                          ? { transform: [{ rotate: rotation }] }
                          : { transform: [{ scale: pulseAnim }] },
                      ]}
                    >
                      {weatherEmoji}
                    </Animated.Text>
                    {temp !== null && (
                      <Text style={styles.modalTemp}>{Math.round(temp)}°</Text>
                    )}
                  </View>
                  <Text style={styles.modalMessage}>{greeting ?? ''}</Text>
                  <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
                    <Text style={styles.modalButtonText}>Gracias</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 56,
    position: 'relative',
  },
  leftColumn: {
    width: 44,
    minHeight: 40,
  },
  centerColumn: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 56,
  },
  title: {
    fontFamily: typography.fontFamily.vogue,
    letterSpacing: 3,
    color: colors.text,
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: typography.fontFamily.vogue,
    fontSize: 13,
    letterSpacing: 1.5,
    color: colors.text,
    marginTop: 2,
    opacity: 0.9,
  },
  rightColumn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingLeft: 12,
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  weatherChipLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(221, 190, 169, 0.85)',
    backgroundColor: colors.primaryMuted,
    minWidth: 68,
    minHeight: 36,
  },
  weatherLoadingTemp: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 16,
    color: colors.primaryVariant,
    opacity: 0.45,
  },
  weatherEmoji: {
    fontSize: 20,
  },
  tempText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 16,
    color: colors.text,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  errorText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.light,
    color: '#B00020',
    marginTop: 2,
    textAlign: 'center',
    maxWidth: 220,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 96,
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    alignItems: 'center',
    width: '100%',
  },
  modalCardOuter: {
    width: '100%',
    maxWidth: 340,
    padding: 4,
    borderRadius: radius.xl + 4,
    backgroundColor: colors.primaryVariant + '55',
    shadowColor: colors.primaryVariant,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 16,
  },
  modalGlowRing: {
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.primaryVariant,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  modalCard: {
    borderRadius: radius.xl - 2,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  modalAccentBar: {
    alignSelf: 'stretch',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primaryVariant,
    marginBottom: spacing.md,
    opacity: 0.85,
  },
  weatherInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primaryVariant,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  modalEmoji: {
    fontSize: 30,
  },
  modalTemp: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 24,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  modalMessage: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.primaryVariant,
    ...shadows.elevated,
  },
  modalButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
    color: colors.onPrimary,
  },
});
