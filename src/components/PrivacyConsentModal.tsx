import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';

const PRIVACY_POLICY_URL = 'https://naim.app/privacidad';

interface PrivacyConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function PrivacyConsentModal({ visible, onAccept, onDecline }: PrivacyConsentModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDecline}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Uso de IA para clasificar prendas</Text>
            <Text style={styles.body}>
              Al añadir una foto, NAIM la envía de forma segura a Groq (proveedor de IA) para
              sugerir automáticamente categoría, colores, ocasión y estación.
            </Text>
            <Text style={styles.body}>
              Puedes revisar y corregir cualquier sugerencia antes de guardar. No compartimos tus
              fotos con fines publicitarios.
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
              <Text style={styles.link}>Ver política de privacidad</Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
              <Text style={styles.declineText}>Ahora no</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
              <Text style={styles.acceptText}>Acepto y continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.onSurfaceVariant,
    marginBottom: 12,
  },
  link: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
    marginTop: 4,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outline + '80',
    alignItems: 'center',
  },
  declineText: {
    fontSize: 15,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  acceptText: {
    fontSize: 15,
    color: colors.onPrimary,
    fontWeight: '600',
  },
});
