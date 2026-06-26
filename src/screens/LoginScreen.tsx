import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NaimDialog } from '../components/NaimDialog';
import { useAuthSession } from '../context/AuthSessionContext';
import type { RootStackParamList } from '../navigation/types';
import { clearWantsLoginScreen } from '../services/authService';
import {
  assessPasswordLogin,
  completePasswordLogin,
  IdentityNeedsDiscardError,
} from '../services/identityTransitionService';
import { colors, naimButtons, radius, spacing, typography } from '../theme';

const NAIM_LOGO = require('../../assets/naim.png');

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { applySession } = useAuthSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingDiscard, setPendingDiscard] = useState(false);
  const [dialog, setDialog] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });

  const showInfo = (title: string, message: string) => {
    setDialog({ visible: true, title, message });
  };

  const enterApp = async (discardWardrobe?: boolean) => {
    const session = await completePasswordLogin(email.trim(), password, { discardWardrobe });
    applySession(session);
    await clearWantsLoginScreen();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    );
  };

  const handleSignIn = async () => {
    if (!password.trim()) {
      showInfo('Contraseña necesaria', 'Introduce la contraseña de tu cuenta NAIM.');
      return;
    }

    setBusy(true);
    try {
      const assessment = await assessPasswordLogin();
      if (assessment.status === 'needs_discard_confirmation') {
        setPendingDiscard(true);
        return;
      }

      await enterApp();
    } catch (err) {
      if (err instanceof IdentityNeedsDiscardError) {
        setPendingDiscard(true);
        return;
      }
      showInfo(
        'No pudimos iniciar sesión',
        err instanceof Error ? err.message : 'Inténtalo de nuevo en un momento.'
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmDiscardAndSignIn = async () => {
    setPendingDiscard(false);
    setBusy(true);
    try {
      await enterApp(true);
    } catch (err) {
      showInfo(
        'No pudimos iniciar sesión',
        err instanceof Error ? err.message : 'Inténtalo de nuevo en un momento.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRegresar = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Onboarding');
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
            <Image source={NAIM_LOGO} style={styles.brandLogo} resizeMode="contain" />
            <Text style={styles.brandLabel}>NAIM</Text>
            <Text style={styles.title}>Iniciar sesión</Text>
            <Text style={styles.subtitle}>
              Escribe el correo y la contraseña de tu cuenta NAIM para cargar tu guardarropa al
              instante.
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

            <Text style={styles.inputLabel}>Contraseña</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholder="Tu contraseña"
              placeholderTextColor={colors.onSurfaceVariant}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              onSubmitEditing={() => void handleSignIn()}
            />

            <TouchableOpacity
              style={[
                naimButtons.primary,
                styles.primaryAction,
                (busy || !email.trim() || !password.trim()) && styles.disabled,
              ]}
              onPress={() => void handleSignIn()}
              disabled={busy || !email.trim() || !password.trim()}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={naimButtons.primaryText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[naimButtons.muted, styles.backAction, busy && styles.disabled]}
              onPress={handleRegresar}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Text style={naimButtons.mutedText}>Regresar</Text>
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

      <NaimDialog
        visible={pendingDiscard}
        title="¿Descartar este guardarropa?"
        message="Hay prendas o perfil sin respaldar en esta sesión. Para iniciar sesión con tu correo debes descartarlos o vincularlos primero en Ajustes."
        tone="warm"
        primaryText="Descartar e iniciar sesión"
        secondaryText="Cancelar"
        primaryDestructive
        onPrimary={() => void confirmDiscardAndSignIn()}
        onDismiss={() => setPendingDiscard(false)}
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
  brandLogo: {
    alignSelf: 'center',
    width: 128,
    height: 128,
    marginBottom: spacing.xs,
  },
  brandLabel: {
    fontFamily: typography.fontFamily.vogue,
    fontSize: 20,
    letterSpacing: 5,
    color: '#4E3A31',
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
  backAction: {},
  disabled: {
    opacity: 0.6,
  },
});
