import React, { useState, useRef } from 'react';
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { saveImageForGarment } from '../utils/platformStorage';
import { useGarments } from '../context/GarmentContext';
import { Garment } from '../types/garment';
import { GARMENT_TYPES, OCCASIONS, SEASONS } from '../config/categories';
import { colors } from '../theme/colors';
import { ExpandableSelector } from '../components/ExpandableSelector';
import { StackBottomNav } from '../components/StackBottomNav';
import { v4 as uuid } from 'uuid';

interface AddGarmentScreenProps {
  hideBottomNav?: boolean;
}

export function AddGarmentScreen({ hideBottomNav = false }: AddGarmentScreenProps) {
  const { addGarment } = useGarments();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(GARMENT_TYPES[0]);
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0]);
  const [season, setSeason] = useState<string>(SEASONS[4]);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedSelector, setExpandedSelector] = useState<'category' | 'occasion' | 'season' | null>(null);
  const successOpacity = useRef(new Animated.Value(0)).current;

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Necesitamos acceso a la galería.', [{ text: 'De acuerdo' }]);
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    setImageUri(result.assets[0].uri);
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Escribe un nombre para la prenda.', [{ text: 'De acuerdo' }]);
      return;
    }
    if (!imageUri) {
      Alert.alert('Foto requerida', 'Añade una foto de la prenda.', [{ text: 'De acuerdo' }]);
      return;
    }

    setSaving(true);
    try {
      const garmentId = uuid();
      const imagePath = await saveImageForGarment(imageUri, garmentId);

      const garment: Garment = {
        id: garmentId,
        name: name.trim(),
        imagePath,
        category,
        colors: [],
        occasion,
        season,
        createdAt: new Date().toISOString(),
        wearCount: 0,
      };

      await addGarment(garment);
      setShowSuccess(true);
      Animated.sequence([
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(successOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSuccess(false);
        successOpacity.setValue(0);
        setImageUri(null);
        setName('');
        setCategory(GARMENT_TYPES[0]);
        setOccasion(OCCASIONS[0]);
        setSeason(SEASONS[4]);
      });
    } catch (e) {
      Alert.alert('Error', String(e), [{ text: 'De acuerdo' }]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.imageArea} onPress={pickImage}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderEmoji}>📷</Text>
              <Text style={styles.placeholderText}>Toca para añadir foto</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Nombre (ej: Camiseta negra básica)"
          value={name}
          onChangeText={setName}
          placeholderTextColor={colors.onSurfaceVariant}
        />

        <ExpandableSelector
          label="Categoría"
          options={GARMENT_TYPES}
          value={category}
          onSelect={setCategory}
          expanded={expandedSelector === 'category'}
          onToggle={() => setExpandedSelector((prev) => (prev === 'category' ? null : 'category'))}
        />
        <ExpandableSelector
          label="Ocasión"
          options={OCCASIONS}
          value={occasion}
          onSelect={setOccasion}
          expanded={expandedSelector === 'occasion'}
          onToggle={() => setExpandedSelector((prev) => (prev === 'occasion' ? null : 'occasion'))}
        />
        <ExpandableSelector
          label="Estación"
          options={SEASONS}
          value={season}
          onSelect={setSeason}
          expanded={expandedSelector === 'season'}
          onToggle={() => setExpandedSelector((prev) => (prev === 'season' ? null : 'season'))}
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={save}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
        </ScrollView>

        {/* Overlay de éxito premium */}
        {showSuccess && (
          <Animated.View style={[styles.successOverlay, { opacity: successOpacity }]}>
            <View style={styles.successContent}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successText}>¡Prenda guardada con éxito!</Text>
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
      {!hideBottomNav && <StackBottomNav />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: 20,
  },
  imageArea: {
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.outline + '30',
    marginBottom: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.onSurface,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.outline + '50',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  successIcon: {
    fontSize: 48,
    color: colors.primary,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  successText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
});
