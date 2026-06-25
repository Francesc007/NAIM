import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrCreateDeviceId, getGarmentsStorageKey } from './deviceIdService';
import {
  deleteCurrentAccount,
  signOutCurrentUser,
} from './profileService';
import { markWantsLoginScreen } from './authService';

const USER_NAME_KEY = '@guardarropa_user_name';
const USER_AVATAR_KEY = '@guardarropa_user_avatar';

export type AccountProtectionProfile = {
  email: string | null;
  emailConfirmed: boolean;
  isAnonymous: boolean;
};

/** Cuenta con email confirmado: los datos se pueden recuperar con magic link. */
export function isAccountDataProtected(profile: AccountProtectionProfile): boolean {
  return Boolean(profile.email?.trim() && profile.emailConfirmed);
}

export function needsSyncRecommendation(profile: AccountProtectionProfile): boolean {
  return !isAccountDataProtected(profile);
}

/** Limpia cache local de perfil y prendas sin borrar flags de onboarding. */
export async function clearLocalSessionData(): Promise<void> {
  try {
    const deviceId = await getOrCreateDeviceId();
    await AsyncStorage.multiRemove([
      USER_NAME_KEY,
      USER_AVATAR_KEY,
      getGarmentsStorageKey(deviceId),
    ]);
  } catch (err) {
    console.warn('[NAIM] Limpiar datos locales:', err);
  }
}

/** Cierra sesión conservando datos en la nube (cuenta con email confirmado). */
export async function signOutProtectedAccount(): Promise<void> {
  await signOutCurrentUser();
  await clearLocalSessionData();
  await markWantsLoginScreen();
}

/**
 * Cierra sesión sin respaldo: elimina cuenta, Storage e items en Supabase
 * para evitar datos huérfanos.
 */
export async function signOutAndPurgeUnprotectedAccount(): Promise<void> {
  await deleteCurrentAccount();
  try {
    await signOutCurrentUser();
  } catch {
    // La cuenta ya pudo eliminarse en el RPC.
  }
  await clearLocalSessionData();
  await markWantsLoginScreen();
}
