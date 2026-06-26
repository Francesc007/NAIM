import React, { useState, useRef, useCallback } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { saveImageForGarment } from '../utils/platformStorage';
import { useGarments } from '../context/GarmentContext';
import { Garment } from '../types/garment';
import { GARMENT_TYPES, OCCASIONS, SEASONS } from '../config/categories';
import { colors, radius, shadows, spacing, subtleBrightBorder, typography } from '../theme';
import { ExpandableSelector } from '../components/ExpandableSelector';
import { ClassificationTags } from '../components/ClassificationTags';
import { SyncAccountHint } from '../components/SyncAccountHint';
import { StackBottomNav } from '../components/StackBottomNav';
import { Skeleton } from '../components/ui/Skeleton';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { classifyImage } from '../services/aiClassificationService';
import { useAccountProtection } from '../hooks/useAccountProtection';
import { v4 as uuid } from 'uuid';

interface AddGarmentScreenProps {
  hideBottomNav?: boolean;
}

export function AddGarmentScreen({ hideBottomNav = false }: AddGarmentScreenProps) {
  const navigation = useNavigation();
  const { addGarment } = useGarments();
  const { needsSync, loading: protectionLoading, refresh: refreshProtection } = useAccountProtection();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(GARMENT_TYPES[0]);
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0]);
  const [season, setSeason] = useState<string>(SEASONS[4]);
  const [garmentColors, setGarmentColors] = useState<string[]>([]);
  const [subcategory, setSubcategory] = useState<string | undefined>();
  const [classifying, setClassifying] = useState(false);
  const [classificationError, setClassificationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedSelector, setExpandedSelector] = useState<'category' | 'occasion' | 'season' | null>(null);
  const successOpacity = useRef(new Animated.Value(0)).current;

  const resetForm = useCallback(() => {
    setImageUri(null);
    setName('');
    setCategory(GARMENT_TYPES[0]);
    setOccasion(OCCASIONS[0]);
    setSeason(SEASONS[4]);
    setGarmentColors([]);
    setSubcategory(undefined);
    setClassificationError(null);
  }, []);

  const runClassification = useCallback(async (uri: string) => {
    setClassifying(true);
    setClassificationError(null);
    try {
      const result = await classifyImage(uri);
      setCategory(result.category);
      setOccasion(result.occasion);
      setSeason(result.season);
      setGarmentColors(result.colors);
      setSubcategory(result.subcategory);
      setName((prev) => (prev.trim() ? prev : result.suggestedName));
    } catch {
      setClassificationError('No pudimos clasificar automáticamente. Completa los campos manualmente.');
    } finally {
      setClassifying(false);
    }
  }, []);

  const launchImagePicker = useCallback(async () => {
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

    const uri = result.assets[0].uri;
    setImageUri(uri);
    void runClassification(uri);
  }, [runClassification]);

  const pickImage = useCallback(async () => {
    await launchImagePicker();
  }, [launchImagePicker]);

  useFocusEffect(
    useCallback(() => {
      void refreshProtection();
    }, [refreshProtection])
  );

  const openSettings = useCallback(() => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('Settings' as never);
      return;
    }
    navigation.navigate('Settings' as never);
  }, [navigation]);

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
        subcategory,
        colors: garmentColors,
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
        resetForm();
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
        {!protectionLoading && needsSync ? (
          <SyncAccountHint onPressSync={openSettings} />
        ) : null}

        <TouchableOpacity style={styles.imageArea} onPress={pickImage} disabled={classifying}>
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
          {classifying && (
            <View style={styles.classifyingOverlay}>
              <Skeleton width={140} height={12} />
              <Skeleton width={180} height={10} />
              <Skeleton width={120} height={10} />
              <Text style={styles.classifyingText}>Analizando prenda...</Text>
            </View>
          )}
        </TouchableOpacity>

        {classificationError ? (
          <Text style={styles.hint}>{classificationError}</Text>
        ) : null}

        <ClassificationTags colors={garmentColors} subcategory={subcategory} />

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
          style={[styles.saveButton, (saving || classifying) && styles.saveButtonDisabled]}
          onPress={save}
          disabled={saving || classifying}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
        </ScrollView>

        {showSuccess && (
          <Animated.View style={[styles.successOverlay, { opacity: successOpacity }]}>
            <View style={styles.successContent}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successText}>¡Prenda guardada con éxito!</Text>
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>

      <LoadingOverlay visible={saving} message="Subiendo imagen y guardando tu prenda..." />

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
    padding: spacing.lg,
  },
  imageArea: {
    height: 200,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryMuted,
    marginBottom: spacing.xs,
    overflow: 'hidden',
    ...subtleBrightBorder,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  classifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248,249,250,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  classifyingText: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
  },
  hint: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
    fontFamily: typography.fontFamily.italic,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.onSurface,
    fontFamily: typography.fontFamily.regular,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.xs,
    ...shadows.card,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successContent: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: 40,
    alignItems: 'center',
    ...shadows.elevated,
  },
  successIcon: {
    fontSize: 48,
    color: colors.primary,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  successText: {
    fontSize: 18,
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
  },
});
