import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { NaimDialog, NaimDialogTone } from '../components/NaimDialog';
import { useAuthSession } from '../context/AuthSessionContext';
import { useUser, GUEST_DISPLAY_NAME, getUserInitial } from '../context/UserContext';
import { colors, naimButtons, radius, shadows, spacing, subtleBrightBorder, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import {
  isAccountDataProtected,
  signOutAndPurgeUnprotectedAccount,
  signOutProtectedAccount,
} from '../services/accountProtectionService';
import {
  createAnonymousSession,
  deleteCurrentAccount,
  getProfileFromSupabase,
  linkAnonymousAccount,
  removeProfileImage,
  updateProfileName,
  uploadProfileImage,
} from '../services/profileService';

type DialogState = {
  visible: boolean;
  title: string;
  message?: string;
  tone?: NaimDialogTone;
  primaryText?: string;
  secondaryText?: string;
  primaryDestructive?: boolean;
  onPrimary?: () => void;
  onSecondary?: () => void;
};

const initialDialog: DialogState = {
  visible: false,
  title: '',
  message: '',
};

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { requestLoginScreen } = useAuthSession();
  const { userName, setUserName, avatarUrl, avatarDisplayUrl, setAvatarUrl, resetLocalProfile } = useUser();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [savedNameBaseline, setSavedNameBaseline] = useState('');
  const [dialog, setDialog] = useState<DialogState>(initialDialog);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [linkEmailDraft, setLinkEmailDraft] = useState('');

  const profileImageUri = avatarDisplayUrl ?? avatarUrl;
  const accountProtected = isAccountDataProtected({
    email: accountEmail,
    emailConfirmed,
    isAnonymous,
  });

  const showDialog = (config: Omit<DialogState, 'visible'>) => {
    setDialog({ ...config, visible: true });
  };

  const closeDialog = () => setDialog(initialDialog);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await getProfileFromSupabase();
        if (!mounted) return;
        if (profile.avatarUrl) {
          await setAvatarUrl(profile.avatarUrl);
        }
        const loadedName = (userName ?? profile.displayName ?? '').trim();
        setDraftName(loadedName);
        setSavedNameBaseline(loadedName);
        setIsAnonymous(profile.isAnonymous);
        setAccountEmail(profile.email);
        setEmailConfirmed(profile.emailConfirmed);
      } catch (err) {
        console.warn('[NAIM] Perfil ajustes:', err);
        if (mounted) {
          const fallback = (userName ?? '').trim();
          setDraftName(fallback);
          setSavedNameBaseline(fallback);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // Solo al montar la pantalla — evita sobrescribir avatar recién subido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = useMemo(() => {
    const trimmedDraft = draftName.trim();
    if (trimmedDraft) return trimmedDraft.slice(0, 1).toUpperCase();
    return getUserInitial(userName);
  }, [draftName, userName]);

  const persistName = async (options?: { silent?: boolean }) => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      setDraftName(savedNameBaseline);
      if (!options?.silent) {
        showDialog({
          title: 'Un detalle necesario',
          message: 'Escríbenos cómo quieres que te saludemos en Inicio.',
          tone: 'info',
          primaryText: 'De acuerdo',
        });
      }
      return;
    }

    if (trimmed === savedNameBaseline) return;

    setBusy(true);
    try {
      await updateProfileName(trimmed);
      await setUserName(trimmed);
      setSavedNameBaseline(trimmed);
    } catch (err) {
      showDialog({
        title: 'No pudimos guardar',
        message: err instanceof Error ? err.message : 'Inténtalo de nuevo en un momento.',
        tone: 'info',
        primaryText: 'Entendido',
      });
    } finally {
      setBusy(false);
    }
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showDialog({
        title: 'Acceso a fotos',
        message: 'Activa el permiso de galería para personalizar tu perfil con elegancia.',
        tone: 'info',
        primaryText: 'Entendido',
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
      aspect: [1, 1],
    });
    if (result.canceled) return;

    const picked = result.assets?.[0]?.uri;
    if (!picked) return;

    setBusy(true);
    try {
      const url = await uploadProfileImage(picked);
      await setAvatarUrl(url);
      showDialog({
        title: 'Foto guardada',
        message: 'Tu imagen de perfil ya luce en NAIM, con el detalle que mereces.',
        tone: 'success',
        primaryText: 'Me encanta',
      });
    } catch (err) {
      showDialog({
        title: 'No pudimos subir la foto',
        message: err instanceof Error ? err.message : 'Revisa tu conexión e inténtalo de nuevo.',
        tone: 'info',
        primaryText: 'Entendido',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRemovePhoto = () => {
    if (!avatarUrl) return;
    showDialog({
      title: '¿Quitar tu foto?',
      message:
        'Volverás a mostrar tu inicial en el guardarropa. Puedes elegir una nueva imagen cuando quieras.',
      tone: 'warm',
      secondaryText: 'Cancelar',
      primaryText: 'Quitar foto',
      primaryDestructive: true,
      onPrimary: () => {
        setBusy(true);
        void (async () => {
          try {
            await removeProfileImage();
            await setAvatarUrl(null);
            showDialog({
              title: 'Foto retirada',
              message: 'Tu inicial vuelve a ser el protagonista. Siempre elegante, siempre tú.',
              tone: 'success',
              primaryText: 'Perfecto',
            });
          } catch (err) {
            showDialog({
              title: 'No pudimos quitar la foto',
              message: err instanceof Error ? err.message : 'Inténtalo de nuevo en un momento.',
              tone: 'info',
              primaryText: 'Entendido',
            });
          } finally {
            setBusy(false);
          }
        })();
      },
    });
  };

  const handleLinkEmail = async () => {
    const trimmed = linkEmailDraft.trim();
    if (!trimmed) {
      showDialog({
        title: 'Correo necesario',
        message: 'Escríbenos tu email para sincronizar tu guardarropa.',
        tone: 'info',
        primaryText: 'Entendido',
      });
      return;
    }

    setBusy(true);
    try {
      await linkAnonymousAccount(trimmed);
      setAccountEmail(trimmed.toLowerCase());
      setEmailConfirmed(false);
      setShowEmailModal(false);
      setLinkEmailDraft('');
      showDialog({
        title: 'Revisa tu bandeja',
        message:
          'Te enviamos un enlace de confirmación. Ábrelo en este mismo teléfono para que NAIM vincule tu correo y proteja tu guardarropa.',
        tone: 'success',
        primaryText: 'Perfecto',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Inténtalo de nuevo en un momento.';
      const duplicate = message.toLowerCase().includes('ya está en uso');
      showDialog({
        title: duplicate ? 'Correo en uso' : 'No pudimos vincular',
        message,
        tone: 'info',
        primaryText: 'Entendido',
      });
    } finally {
      setBusy(false);
    }
  };

  const resetProfileUi = () => {
    setDraftName('');
    setSavedNameBaseline('');
    setIsAnonymous(true);
    setAccountEmail(null);
    setEmailConfirmed(false);
  };

  const finishSignOut = async () => {
    await resetLocalProfile();
    resetProfileUi();
    await requestLoginScreen();
  };

  const showSignOutError = (err: unknown) => {
    showDialog({
      title: 'No se pudo cerrar sesión',
      message: err instanceof Error ? err.message : 'Inténtalo de nuevo en un momento.',
      tone: 'info',
      primaryText: 'Entendido',
    });
  };

  const confirmUnprotectedSignOut = () => {
    setTimeout(() => {
      showDialog({
        title: '¿Cerrar sin respaldo?',
        message:
          'Si sales ahora, tu guardarropa se eliminará por completo. No podrás recuperar prendas, imágenes, perfil ni esta sesión en otro momento.',
        tone: 'warm',
        primaryText: 'Salir y borrar',
        secondaryText: 'Volver',
        primaryDestructive: true,
        onPrimary: () => {
          setBusy(true);
          void (async () => {
            try {
              await signOutAndPurgeUnprotectedAccount();
              await finishSignOut();
            } catch (err) {
              showSignOutError(err);
            } finally {
              setBusy(false);
            }
          })();
        },
      });
    }, 280);
  };

  const handleSignOut = () => {
    if (accountProtected) {
      showDialog({
        title: '¿Cerrar sesión?',
        message:
          'Tu guardarropa está respaldado. Podrás volver a entrar con tu correo cuando lo desees.',
        tone: 'warm',
        secondaryText: 'Cancelar',
        primaryText: 'Cerrar sesión',
        onPrimary: () => {
          setBusy(true);
          void (async () => {
            try {
              await signOutProtectedAccount();
              await finishSignOut();
            } catch (err) {
              showSignOutError(err);
            } finally {
              setBusy(false);
            }
          })();
        },
      });
      return;
    }

    showDialog({
      title: 'Antes de salir',
      message:
        'Tu guardarropa aún no está respaldado. Vincula tu correo para conservar prendas, fotos y perfil con elegancia, estés donde estés.',
      tone: 'warm',
      primaryText: 'Sincronizar email',
      secondaryText: 'Cerrar sesión',
      onPrimary: () => setShowEmailModal(true),
      onSecondary: confirmUnprotectedSignOut,
    });
  };

  const handleDeleteAccount = () => {
    showDialog({
      title: '¿Eliminar cuenta?',
      message:
        'Esta acción eliminará tu cuenta y tus prendas guardadas. No se puede deshacer.',
      tone: 'warm',
      secondaryText: 'Cancelar',
      primaryText: 'Eliminar',
      primaryDestructive: true,
      onPrimary: () => {
        setBusy(true);
        void (async () => {
          try {
            await deleteCurrentAccount();
            await AsyncStorage.clear();
            await resetLocalProfile();
            await createAnonymousSession();
            setDraftName('');
            setSavedNameBaseline('');
            showDialog({
              title: 'Cuenta eliminada',
              message: 'Empezamos de cero, con estilo. Ya tienes una nueva sesión anónima.',
              tone: 'success',
              primaryText: 'Entendido',
            });
          } catch (err) {
            showDialog({
              title: 'No se pudo eliminar la cuenta',
              message:
                err instanceof Error
                  ? err.message
                  : 'Verifica la configuración en Supabase e inténtalo de nuevo.',
              tone: 'info',
              primaryText: 'Entendido',
            });
          } finally {
            setBusy(false);
          }
        })();
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.primaryVariant} />
          <Text style={styles.loaderText}>Cargando ajustes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Perfil</Text>
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <TouchableOpacity
                style={[styles.avatarCircle, busy && styles.disabledButton]}
                onPress={handlePickPhoto}
                activeOpacity={0.85}
                disabled={busy}
              >
                {profileImageUri ? (
                  <Image
                    key={profileImageUri}
                    source={{ uri: profileImageUri }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarPlaceholderInner}>
                    <Text style={styles.avatarInitial}>{initials}</Text>
                  </View>
                )}
              </TouchableOpacity>
              {avatarUrl ? (
                <TouchableOpacity
                  style={styles.trashButton}
                  onPress={handleRemovePhoto}
                  activeOpacity={0.75}
                  disabled={busy}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={13} color={colors.error} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <Text style={styles.inputLabel}>Nombre de usuario</Text>
          <TextInput
            value={draftName}
            onChangeText={setDraftName}
            onBlur={() => void persistName({ silent: true })}
            style={styles.input}
            placeholder={GUEST_DISPLAY_NAME}
            placeholderTextColor={colors.onSurfaceVariant}
            autoCapitalize="words"
            editable={!busy}
            returnKeyType="done"
            onSubmitEditing={() => void persistName({ silent: true })}
          />
        </View>

        <View style={styles.card}>
          {isAnonymous && !accountEmail ? (
            <TouchableOpacity
              style={[styles.protectButton, busy && styles.disabledButton]}
              onPress={() => setShowEmailModal(true)}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Text style={styles.protectButtonText}>Sincronizar con email</Text>
            </TouchableOpacity>
          ) : null}

          {accountEmail && !emailConfirmed ? (
            <Text style={styles.accountHint}>
              Confirmación pendiente en {accountEmail}. Revisa tu correo.
            </Text>
          ) : null}

          {accountEmail && emailConfirmed ? (
            <Text style={styles.accountHintProtected}>Sincronizado · {accountEmail}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.signOutButton, busy && styles.disabledButton]}
            onPress={handleSignOut}
            disabled={busy}
          >
            <Text style={styles.signOutText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteTextWrap}
            onPress={handleDeleteAccount}
            disabled={busy}
          >
            <Text style={styles.deleteText}>Eliminar Cuenta</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.privacyLinkWrap}
          onPress={() => navigation.navigate('PrivacyNotice')}
          activeOpacity={0.7}
        >
          <Text style={styles.privacyLink}>Aviso de Privacidad</Text>
        </TouchableOpacity>
      </ScrollView>

      <NaimDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        tone={dialog.tone}
        primaryText={dialog.primaryText}
        secondaryText={dialog.secondaryText}
        primaryDestructive={dialog.primaryDestructive}
        onPrimary={dialog.onPrimary}
        onSecondary={dialog.onSecondary}
        onDismiss={closeDialog}
      />

      <Modal visible={showEmailModal} transparent animationType="fade" onRequestClose={() => setShowEmailModal(false)}>
        <Pressable style={styles.emailModalBackdrop} onPress={() => setShowEmailModal(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.emailModalAvoid}
          >
            <Pressable style={styles.emailModalCardOuter} onPress={(e) => e.stopPropagation()}>
              <LinearGradient
                colors={['#FFFFFF', '#FBF4EF', '#F3E7DF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emailModalCard}
              >
                <Text style={styles.emailModalTitle}>Sincronizar con email</Text>
                <Text style={styles.emailModalMessage}>
                  Vincula tu correo para acceder a tu guardarropa desde cualquier dispositivo. Te
                  enviaremos un enlace de confirmación.
                </Text>
                <TextInput
                  value={linkEmailDraft}
                  onChangeText={setLinkEmailDraft}
                  style={[styles.input, styles.emailModalInput]}
                  placeholder="tu@correo.com"
                  placeholderTextColor={colors.onSurfaceVariant}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!busy}
                />
                <TouchableOpacity
                  style={[naimButtons.primary, busy && styles.disabledButton]}
                  onPress={() => void handleLinkEmail()}
                  disabled={busy}
                  activeOpacity={0.85}
                >
                  <Text style={naimButtons.primaryText}>Enviar confirmación</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[naimButtons.secondary, styles.emailModalCancel, busy && styles.disabledButton]}
                  onPress={() => setShowEmailModal(false)}
                  disabled={busy}
                  activeOpacity={0.75}
                >
                  <Text style={naimButtons.secondaryText}>Cancelar</Text>
                </TouchableOpacity>
              </LinearGradient>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: spacing.sm,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  avatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    ...subtleBrightBorder,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholderInner: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    color: colors.primaryVariant,
    fontFamily: typography.fontFamily.semiBold,
  },
  trashButton: {
    position: 'absolute',
    bottom: 2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
    marginBottom: spacing.xs,
    fontSize: 13,
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
    marginBottom: 0,
  },
  privacyLinkWrap: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  privacyLink: {
    fontSize: 14,
    color: colors.primaryVariant,
    fontFamily: typography.fontFamily.regular,
    letterSpacing: 0.3,
  },
  protectButton: {
    ...naimButtons.primary,
    marginBottom: spacing.sm,
  },
  protectButtonText: {
    ...naimButtons.primaryText,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  signOutButton: {
    ...naimButtons.muted,
    marginTop: spacing.xs,
  },
  accountHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  accountHintProtected: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: colors.primaryVariant,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emailModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(33, 37, 41, 0.42)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emailModalAvoid: {
    width: '100%',
  },
  emailModalCardOuter: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(221, 190, 169, 0.85)',
    overflow: 'hidden',
    ...shadows.elevated,
  },
  emailModalCard: {
    padding: spacing.lg,
  },
  emailModalTitle: {
    fontFamily: typography.fontFamily.vogue,
    fontSize: 22,
    letterSpacing: 1.2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emailModalMessage: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emailModalCancel: {
    marginTop: spacing.sm,
  },
  emailModalInput: {
    marginBottom: spacing.md,
  },
  signOutText: {
    ...naimButtons.mutedText,
    textAlign: 'center',
  },
  deleteTextWrap: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  deleteText: {
    color: colors.error,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loaderText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
