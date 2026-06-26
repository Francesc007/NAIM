import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useWeather } from '../context/WeatherContext';
import { useUser, getUserInitial } from '../context/UserContext';
import { colors, naimButtons, radius, spacing, typography } from '../theme';

const NAIM_LOGO = require('../../assets/naim1.png');

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
  const { userName, avatarUrl, avatarDisplayUrl } = useUser();
  const { greeting, temp, icon, loading, locationError, apiError } = useWeather();
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

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
  const profileInitial = useMemo(() => getUserInitial(userName), [userName]);
  const profileImageUri = avatarDisplayUrl ?? avatarUrl;
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
        <View style={styles.leftColumn} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.profileButton}
            onPress={openSettings}
            activeOpacity={0.75}
          >
            {profileImageUri ? (
              <Image
                key={profileImageUri}
                source={{ uri: profileImageUri }}
                style={styles.profileAvatar}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.profileInitial}>{profileInitial}</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.centerColumn} pointerEvents="box-none">
          <Image source={NAIM_LOGO} style={styles.brandLogo} resizeMode="contain" />
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
                  <TouchableOpacity style={[naimButtons.primary, naimButtons.primaryStandalone]} onPress={closeModal}>
                    <Text style={naimButtons.primaryText}>Gracias</Text>
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
    minHeight: 104,
    position: 'relative',
  },
  leftColumn: {
    width: 56,
    minHeight: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 1,
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
  brandLogo: {
    width: 100,
    height: 100,
    borderRadius: radius.md,
  },
  rightColumn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 56,
    paddingLeft: 12,
    zIndex: 1,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primaryVariant,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
  profileInitial: {
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primaryVariant,
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
    fontSize: 24,
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
    fontSize: 36,
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
});
