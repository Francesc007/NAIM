import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

export function SettingsScreen() {
  const navigation = useNavigation();

  const handleClearStorage = async () => {
    Alert.alert(
      'Limpiar datos locales',
      'Esto borrará prendas, nombre y sesión. La app iniciará como la primera vez. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Listo', 'Datos locales borrados. Reinicia la app.');
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración</Text>
      <TouchableOpacity style={styles.button} onPress={handleClearStorage}>
        <Text style={styles.buttonText}>Limpiar datos locales (AsyncStorage.clear)</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>Borra duplicados, nombre y sesión. Reinicia la app después.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.error,
    padding: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 12,
  },
});
