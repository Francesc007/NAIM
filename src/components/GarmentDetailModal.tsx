import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Garment } from '../types/garment';
import { colors } from '../theme/colors';
import { GARMENT_TYPES, OCCASIONS } from '../config/categories';
import { ExpandableSelector } from './ExpandableSelector';

type Props = {
  garment: Garment | null;
  visible: boolean;
  onClose: () => void;
  onSave: (g: Garment) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function GarmentDetailModal({
  garment,
  visible,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [occasion, setOccasion] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedSelector, setExpandedSelector] = useState<'category' | 'occasion' | null>(null);

  React.useEffect(() => {
    if (garment) {
      setName(garment.name);
      setCategory(garment.category);
      setOccasion(garment.occasion);
    }
  }, [garment]);

  const handleSave = async () => {
    if (!garment) return;
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...garment,
        name: name.trim(),
        category,
        occasion,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!garment) return;
    Alert.alert(
      'Eliminar prenda',
      `¿Deseas eliminar ${garment.name} de tu colección?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await onDelete(garment.id);
            onClose();
          },
        },
      ]
    );
  };

  if (!garment) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={24} color={colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.imageWrap}>
            {garment.imagePath ? (
              <Image
                source={{ uri: garment.imagePath }}
                style={styles.image}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderEmoji}>📷</Text>
              </View>
            )}
          </View>

          <ScrollView
            style={styles.form}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nombre"
              placeholderTextColor={colors.onSurfaceVariant}
            />

            <ExpandableSelector
              label="Categoría"
              options={GARMENT_TYPES}
              value={category}
              onSelect={setCategory}
              expanded={expandedSelector === 'category'}
              onToggle={() => setExpandedSelector((p) => (p === 'category' ? null : 'category'))}
            />
            <ExpandableSelector
              label="Ocasión"
              options={OCCASIONS}
              value={occasion}
              onSelect={setOccasion}
              expanded={expandedSelector === 'occasion'}
              onToggle={() => setExpandedSelector((p) => (p === 'occasion' ? null : 'occasion'))}
            />

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.trashBtn}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={24} color="#ADB5BD" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  imageWrap: {
    width: '100%',
    height: 220,
    backgroundColor: colors.outline + '20',
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
    fontSize: 64,
  },
  form: {
    flexGrow: 1,
  },
  formContent: {
    padding: 20,
    paddingBottom: 32,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.outline + '50',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  trashBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onPrimary,
  },
});
