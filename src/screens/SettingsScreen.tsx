import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { colors, radius, shadows, spacing, typography } from '../theme';
import {
  createAnonymousSession,
  deleteCurrentAccount,
  getProfileFromSupabase,
  signOutCurrentUser,
  updateProfileName,
  uploadProfileImage,
} from '../services/profileService';

export function SettingsScreen() {
  const { userName, setUserName } = useUser();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await getProfileFromSupabase();
        if (!mounted) return;
        setAvatarUrl(profile.avatarUrl);
        setDraftName(userName ?? profile.displayName ?? 'Javier');
      } catch (err) {
        console.warn('[NAIM] Perfil ajustes:', err);
        if (mounted) {
          setDraftName(userName ?? 'Javier');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userName]);

  const initials = useMemo(() => {
    const source = draftName.trim() || userName?.trim() || 'N';
    return source.slice(0, 1).toUpperCase();
  }, [draftName, userName]);

  const handleSaveName = async () => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      Alert.alert('Nombre requerido', 'Escribe un nombre para continuar.');
      return;
    }
    setBusy(true);
    try {
      await updateProfileName(trimmed);
      await setUserName(trimmed);
      Alert.alert('Perfil actualizado', 'Tu nombre se guardó correctamente.');
    } catch (err) {
      Alert.alert('No se pudo guardar', err instanceof Error ? err.message : 'Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Activa el acceso a fotos para cambiar tu perfil.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
      aspect: [1, 1],
    });
    if (result.canceled) return;

    const picked = result.assets?.[0]?.uri;
    if (!picked) return;

    setBusy(true);
    try {
      const url = await uploadProfileImage(picked);
      setAvatarUrl(url);
      Alert.alert('Foto actualizada', 'Tu foto de perfil se guardó en la nube.');
    } catch (err) {
      Alert.alert('No se pudo subir la foto', err instanceof Error ? err.message : 'Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      'Se cerrará tu sesión actual y se iniciará una nueva sesión anónima.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          onPress: async () => {
            setBusy(true);
            try {
              await signOutCurrentUser();
              await AsyncStorage.clear();
              await setUserName(null);
              await createAnonymousSession();
              setAvatarUrl('');
              setDraftName('Javier');
              Alert.alert('Listo', 'Sesión cerrada correctamente.');
            } catch (err) {
              Alert.alert('No se pudo cerrar sesión', err instanceof Error ? err.message : 'Intenta de nuevo.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción eliminará tu cuenta actual y sus datos asociados. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar cuenta',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await deleteCurrentAccount();
              await AsyncStorage.clear();
              await setUserName(null);
              await createAnonymousSession();
              setAvatarUrl('');
              setDraftName('Javier');
              Alert.alert('Cuenta eliminada', 'Se creó una nueva sesión anónima.');
            } catch (err) {
              Alert.alert(
                'No se pudo eliminar la cuenta',
                err instanceof Error ? err.message : 'Verifica la configuración en Supabase.'
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
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
        <Text style={styles.title}>Ajustes de Perfil</Text>
        <Text style={styles.subtitle}>Controla tu identidad y tu cuenta de NAIM.</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Perfil</Text>
          <View style={styles.avatarRow}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{initials}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.secondaryButton, busy && styles.disabledButton]}
              onPress={handlePickPhoto}
              disabled={busy}
            >
              <Text style={styles.secondaryButtonText}>Cambiar foto</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Nombre de usuario</Text>
          <TextInput
            value={draftName}
            onChangeText={setDraftName}
            style={styles.input}
            placeholder="Javier"
            placeholderTextColor={colors.onSurfaceVariant}
            autoCapitalize="words"
            editable={!busy}
          />
          <TouchableOpacity
            style={[styles.primaryButton, busy && styles.disabledButton]}
            onPress={handleSaveName}
            disabled={busy}
          >
            <Text style={styles.primaryButtonText}>Guardar cambios</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
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
      </ScrollView>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    fontSize: 24,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.semiBold,
    letterSpacing: 0.4,
  },
  subtitle: {
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    marginBottom: spacing.xs,
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
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primaryVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 26,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.semiBold,
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
    marginBottom: spacing.md,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primaryVariant,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    color: colors.primaryVariant,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 15,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
  },
  signOutText: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.regular,
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
