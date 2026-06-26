import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  clearOnboardingCompleted,
  hasCompletedOnboardingLocal,
} from './authService';
import {
  clearLocalSessionData,
  isAccountDataProtected,
  signOutProtectedAccount,
  type AccountProtectionProfile,
} from './accountProtectionService';
import {
  createAnonymousSession,
  deleteCurrentAccount,
  getProfileFromSupabase,
  signInWithEmailPassword,
  signOutCurrentUser,
} from './profileService';
import { garmentRepository } from './garmentRepository';

const LAST_USER_ID_KEY = '@naim_last_user_id';

export class IdentityNeedsDiscardError extends Error {
  constructor(message = 'Esta sesión tiene un guardarropa sin respaldar.') {
    super(message);
    this.name = 'IdentityNeedsDiscardError';
  }
}

export class IdentityProtectedAccountError extends Error {
  constructor(
    message = 'Cierra sesión desde Ajustes antes de iniciar como invitado en este dispositivo.'
  ) {
    super(message);
    this.name = 'IdentityProtectedAccountError';
  }
}

export type IdentityAssessment = AccountProtectionProfile & {
  userId: string;
  hasWardrobeData: boolean;
  hasCompletedOnboarding: boolean;
};

export type GuestSessionAssessment =
  | { status: 'no_session' }
  | { status: 'reuse' }
  | { status: 'needs_discard_confirmation' };

export type PasswordLoginAssessment =
  | { status: 'ready' }
  | { status: 'needs_discard_confirmation' };

/** @deprecated Usar PasswordLoginAssessment */
export type MagicLinkAssessment = PasswordLoginAssessment;

async function countRemoteGarments(userId: string): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) {
    console.warn('[NAIM] Conteo de prendas:', error.message);
    return 0;
  }
  return count ?? 0;
}

export async function hasWardrobeDataForCurrentUser(): Promise<boolean> {
  if (!supabase) return false;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return false;

  const profile = await getProfileFromSupabase();

  const [remoteCount, localGarments] = await Promise.all([
    countRemoteGarments(user.id),
    garmentRepository.getAll(),
  ]);

  return (
    remoteCount > 0 ||
    localGarments.length > 0 ||
    Boolean(profile.avatarUrl.trim() || profile.avatarStoragePath?.trim()) ||
    profile.onboardingCompleted
  );
}

export async function getIdentityAssessment(): Promise<IdentityAssessment | null> {
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const profile = await getProfileFromSupabase();
  const hasWardrobeData = await hasWardrobeDataForCurrentUser();
  const hasCompletedOnboarding =
    profile.displayName.trim().length > 0 ||
    (await hasCompletedOnboardingLocal()) ||
    profile.onboardingCompleted;

  return {
    userId: profile.userId,
    email: profile.email,
    emailConfirmed: profile.emailConfirmed,
    isAnonymous: profile.isAnonymous,
    hasWardrobeData,
    hasCompletedOnboarding,
  };
}

export async function noteUserIdentity(userId: string): Promise<void> {
  const previousUserId = await AsyncStorage.getItem(LAST_USER_ID_KEY);
  if (previousUserId && previousUserId !== userId) {
    await clearOnboardingCompleted();
  }
  await AsyncStorage.setItem(LAST_USER_ID_KEY, userId);
}

export async function handleUserIdChanged(
  previousUserId: string | null,
  nextUserId: string
): Promise<void> {
  if (previousUserId && previousUserId !== nextUserId) {
    await clearLocalSessionData();
  }
  await noteUserIdentity(nextUserId);
}

export async function purgeUnprotectedCurrentAccount(): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado');

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await clearLocalSessionData();
    return;
  }

  const profile = await getProfileFromSupabase();
  if (isAccountDataProtected(profile)) {
    throw new IdentityProtectedAccountError();
  }

  await deleteCurrentAccount();
  try {
    await signOutCurrentUser();
  } catch {
    // La cuenta ya pudo eliminarse en el RPC.
  }
  await clearLocalSessionData();
  await clearOnboardingCompleted();
}

export async function assessGuestSession(): Promise<GuestSessionAssessment> {
  if (!supabase) return { status: 'no_session' };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { status: 'no_session' };

  const assessment = await getIdentityAssessment();
  if (!assessment) return { status: 'no_session' };

  if (isAccountDataProtected(assessment)) {
    throw new IdentityProtectedAccountError();
  }

  if (assessment.hasWardrobeData) {
    return { status: 'needs_discard_confirmation' };
  }

  return { status: 'reuse' };
}

export async function startGuestSession(options?: {
  discardExisting?: boolean;
}): Promise<Session> {
  if (!supabase) throw new Error('Supabase no configurado');

  const {
    data: { session: existingSession },
  } = await supabase.auth.getSession();

  if (!existingSession) {
    const session = await createAnonymousSession();
    await noteUserIdentity(session.user.id);
    return session;
  }

  const assessment = await getIdentityAssessment();
  if (!assessment) {
    const session = await createAnonymousSession();
    await noteUserIdentity(session.user.id);
    return session;
  }

  if (isAccountDataProtected(assessment)) {
    throw new IdentityProtectedAccountError();
  }

  if (assessment.hasWardrobeData) {
    if (!options?.discardExisting) {
      throw new IdentityNeedsDiscardError();
    }
    await purgeUnprotectedCurrentAccount();
    const session = await createAnonymousSession();
    await noteUserIdentity(session.user.id);
    return session;
  }

  await noteUserIdentity(existingSession.user.id);
  return existingSession;
}

export async function assessPasswordLogin(): Promise<PasswordLoginAssessment> {
  if (!supabase) return { status: 'ready' };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { status: 'ready' };

  const assessment = await getIdentityAssessment();
  if (!assessment) return { status: 'ready' };

  if (isAccountDataProtected(assessment)) {
    return { status: 'ready' };
  }

  if (assessment.hasWardrobeData) {
    return { status: 'needs_discard_confirmation' };
  }

  return { status: 'ready' };
}

/** @deprecated Usar assessPasswordLogin */
export async function assessMagicLinkLogin(): Promise<PasswordLoginAssessment> {
  return assessPasswordLogin();
}

export async function completePasswordLogin(
  email: string,
  password: string,
  options?: { discardWardrobe?: boolean }
): Promise<Session> {
  if (!supabase) throw new Error('Supabase no configurado');

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    const assessment = await getIdentityAssessment();
    if (assessment && isAccountDataProtected(assessment)) {
      await signOutProtectedAccount();
    } else if (assessment?.hasWardrobeData) {
      if (!options?.discardWardrobe) {
        throw new IdentityNeedsDiscardError();
      }
      await purgeUnprotectedCurrentAccount();
    } else if (assessment) {
      await purgeUnprotectedCurrentAccount();
    }
  }

  const nextSession = await signInWithEmailPassword(email, password);
  await noteUserIdentity(nextSession.user.id);
  return nextSession;
}

/** @deprecated Usar completePasswordLogin */
export async function completeMagicLinkLogin(
  _email: string,
  _options?: { discardWardrobe?: boolean }
): Promise<void> {
  throw new Error('Usa completePasswordLogin con correo y contraseña.');
}
