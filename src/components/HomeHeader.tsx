import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  useWindowDimensions,
} from 'react-native';
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

export function HomeHeader() {
  const { width } = useWindowDimensions();
  const { greeting, temp, icon, loading, locationError } = useWeatherGreeting();
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const titleSize = Math.min(26, Math.max(18, Math.floor(width * 0.065) + 2));
  const weatherEmoji = icon ? (WEATHER_EMOJIS[icon] ?? '🌡️') : '🌡️';

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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.leftColumn} />
        <View style={styles.centerColumn}>
          <Text style={[styles.title, { fontSize: titleSize }]} allowFontScaling={false}>
            {APP_NAME}
          </Text>
          <Text style={styles.subtitle}>Tu Estilo Inteligente</Text>
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
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.modalBackdrop, { opacity: fadeAnim }]} />
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalEmoji}>{weatherEmoji}</Text>
                {temp !== null && (
                  <Text style={styles.modalTemp}>{Math.round(temp)}°</Text>
                )}
              </View>
              <Text style={styles.modalMessage}>{greeting ?? ''}</Text>
              <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
                <Text style={styles.modalButtonText}>Gracias</Text>
              </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 48,
  },
  leftColumn: {
    width: 72,
    flexShrink: 0,
  },
  centerColumn: {
    flex: 1,
    flexShrink: 0,
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  title: {
    fontFamily: typography.fontFamily.vogue,
    letterSpacing: 3,
    color: colors.text,
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
    width: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 60,
  },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
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
    backgroundColor: 'rgba(0,0,0,0.35)',
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
    paddingBottom: 32,
  },
  modalContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalEmoji: {
    fontSize: 32,
  },
  modalTemp: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    color: colors.text,
  },
  modalMessage: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: colors.onSurface,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  modalButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
    color: colors.onPrimary,
  },
});
