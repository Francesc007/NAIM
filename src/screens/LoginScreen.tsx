import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NaimDialog } from '../components/NaimDialog';
import { APP_NAME } from '../constants/mockData';
import { useAuthSession } from '../context/AuthSessionContext';
import type { RootStackParamList } from '../navigation/types';
import { clearWantsLoginScreen } from '../services/authService';
import { createAnonymousSession, signInWithMagicLink } from '../services/profileService';
import { colors, naimButtons, radius, spacing, typography } from '../theme';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { applySession } = useAuthSession();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });

  const showSuccess = (title: string, message: string) => {
    setDialog({ visible: true, title, message });
  };

  const handleSendMagicLink = async () => {
    setBusy(true);
    try {
      await signInWithMagicLink(email);
      await clearWantsLoginScreen();
      showSuccess(
        'Revisa tu correo',
        'Te enviamos un enlace mágico para acceder a tu guardarropa. Ábrelo en este dispositivo.'
      );
    } catch (err) {
      showSuccess(
        'No pudimos enviar el enlace',
        err instanceof Error ? err.message : 'Inténtalo de nuevo en un momento.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleContinueAsGuest = async () => {
    setBusy(true);
    try {
      await clearWantsLoginScreen();
      const session = await createAnonymousSession();
      applySession(session);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (err) {
      showSuccess(
        'No pudimos continuar',
        err instanceof Error ? err.message : 'Inténtalo de nuevo en un momento.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <LinearGradient
            colors={['#FFFFFF', '#FBF4EF', '#F3E7DF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <Text style={styles.brand}>{APP_NAME}</Text>
            <Text style={styles.title}>Bienvenido de nuevo</Text>
            <Text style={styles.subtitle}>
              Si ya protegiste tu cuenta con email, te enviamos un enlace para recuperar tu
              guardarropa. Si eres nuevo, toca Continuar con NAIM.
            </Text>

            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="tu@correo.com"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
            />

            <TouchableOpacity
              style={[naimButtons.primary, styles.primaryAction, busy && styles.disabled]}
              onPress={() => void handleSendMagicLink()}
              disabled={busy || !email.trim()}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={naimButtons.primaryText}>Enviar enlace mágico</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[naimButtons.muted, styles.secondaryAction, busy && styles.disabled]}
              onPress={() => void handleContinueAsGuest()}
              disabled={busy}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color={colors.primaryVariant} />
              ) : (
                <Text style={naimButtons.mutedText}>Continuar con NAIM</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>

      <NaimDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        tone="info"
        primaryText="Entendido"
        onDismiss={() => setDialog((d) => ({ ...d, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(221, 190, 169, 0.85)',
  },
  brand: {
    fontFamily: typography.fontFamily.vogue,
    fontSize: 28,
    letterSpacing: 4,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: typography.fontFamily.vogue,
    fontSize: 22,
    letterSpacing: 1.2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    marginBottom: spacing.lg,
  },
  primaryAction: {
    marginBottom: spacing.sm,
  },
  secondaryAction: {},
  disabled: {
    opacity: 0.6,
  },
});
