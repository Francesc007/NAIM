import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeatherGreeting } from '../hooks/useWeatherGreeting';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
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

const WEATHER_GRADIENTS: Record<string, [string, string]> = {
  '01d': ['#4A90E2', '#87CEEB'],
  '01n': ['#2C3E50', '#4A90E2'],
  '02d': ['#6B8E9F', '#B0C4DE'],
  '02n': ['#4A5568', '#718096'],
  '03d': ['#9E9E9E', '#E0E0E0'],
  '03n': ['#757575', '#BDBDBD'],
  '04d': ['#9E9E9E', '#EEEEEE'],
  '04n': ['#616161', '#9E9E9E'],
  '09d': ['#607D8B', '#90A4AE'],
  '09n': ['#455A64', '#78909C'],
  '10d': ['#546E7A', '#78909C'],
  '10n': ['#37474F', '#607D8B'],
  '11d': ['#37474F', '#546E7A'],
  '11n': ['#263238', '#455A64'],
  '13d': ['#B0BEC5', '#ECEFF1'],
  '13n': ['#90A4AE', '#CFD8DC'],
  '50d': ['#BDBDBD', '#EEEEEE'],
  '50n': ['#9E9E9E', '#E0E0E0'],
};

const DEFAULT_GRADIENT: [string, string] = ['#9E9E9E', '#E0E0E0'];

export function HomeHeader() {
  const { greeting, temp, icon, loading, locationError } = useWeatherGreeting();
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  const weatherEmoji = icon ? (WEATHER_EMOJIS[icon] ?? '🌡️') : '🌡️';
  const gradientColors = icon ? (WEATHER_GRADIENTS[icon] ?? DEFAULT_GRADIENT) : DEFAULT_GRADIENT;

  const openModal = () => {
    if (!greeting && temp === null) return;
    setModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const showWeather = !loading && !locationError && (temp !== null || icon !== null || greeting !== null);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.leftColumn} />
        <View style={styles.centerColumn}>
          <Text style={styles.title}>{APP_NAME}</Text>
        </View>
        <View style={styles.rightColumn}>
          {showWeather && (
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
          )}
        </View>
      </View>
      {locationError && (
        <Text style={styles.errorText} numberOfLines={2}>
          {locationError}
        </Text>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <View style={[StyleSheet.absoluteFill, styles.modalBackdrop]} />
          <View style={[StyleSheet.absoluteFill, styles.gradientOverlay]}>
            <LinearGradient
              colors={[...gradientColors, 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.modalCard,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.modalIconWrap}>
                <Text style={styles.modalEmoji}>{weatherEmoji}</Text>
                {temp !== null && (
                  <Text style={styles.modalTemp}>{Math.round(temp)}°</Text>
                )}
              </View>
              <Text style={styles.modalMessage}>{greeting ?? ''}</Text>
              <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
                <Text style={styles.modalButtonText}>Gracias</Text>
              </TouchableOpacity>
            </Animated.View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 48,
  },
  leftColumn: {
    flex: 1,
  },
  centerColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.fontFamily.vogue,
    fontSize: 26,
    letterSpacing: 4,
    color: colors.text,
  },
  rightColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  weatherEmoji: {
    fontSize: 22,
  },
  tempText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    color: colors.text,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalEmoji: {
    fontSize: 56,
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
  },
  gradientOverlay: {
    opacity: 0.2,
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  modalIconWrap: {
    marginBottom: 16,
    alignItems: 'center',
  },
  modalTemp: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 24,
    color: colors.text,
    marginTop: 4,
  },
  modalMessage: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 17,
    color: colors.onSurface,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  modalButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 16,
    color: colors.onPrimary,
  },
});
