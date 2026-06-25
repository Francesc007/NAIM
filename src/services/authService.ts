import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const WANTS_LOGIN_KEY = '@naim_wants_login';
const ONBOARDING_DONE_KEY = '@naim_onboarding_completed';
const STYLE_PREF_KEY = '@naim_style_preference';
const CLIMATE_PREF_KEY = '@naim_climate_preference';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_TYPES = new Set<string>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

export type AuthLinkNotice = {
  type: 'success' | 'error';
  message: string;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(email));
}

/**
 * Deep link de retorno. Registrar en Supabase → Auth → URL Configuration:
 * - naim://auth/callback
 * - (dev) exp://…/--/auth/callback si aplica
 */
export function getAuthRedirectUrl(): string {
  return Linking.createURL('auth/callback');
}

export function isAuthDeepLink(url: string): boolean {
  if (!url) return false;
  if (url.includes('auth/callback')) return true;
  if (url.includes('access_token=') || url.includes('refresh_token=')) return true;
  if (url.includes('token_hash=') || url.includes('code=')) return true;
  return false;
}

export async function markWantsLoginScreen(): Promise<void> {
  await AsyncStorage.setItem(WANTS_LOGIN_KEY, '1');
}

export async function consumeWantsLoginScreen(): Promise<boolean> {
  const value = await AsyncStorage.getItem(WANTS_LOGIN_KEY);
  if (value) {
    await AsyncStorage.removeItem(WANTS_LOGIN_KEY);
    return true;
  }
  return false;
}

export async function clearWantsLoginScreen(): Promise<void> {
  await AsyncStorage.removeItem(WANTS_LOGIN_KEY);
}

export async function markOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_DONE_KEY, '1');
}

export async function clearOnboardingCompleted(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_DONE_KEY);
}

export async function hasCompletedOnboardingLocal(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
  return value === '1';
}

export async function saveOnboardingPreferences(style: string, climate: string): Promise<void> {
  await AsyncStorage.multiSet([
    [STYLE_PREF_KEY, style],
    [CLIMATE_PREF_KEY, climate],
  ]);
}

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}

/** Extrae parámetros de query (?…) y hash (#…) en deep links de Supabase. */
export function parseAuthParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};

  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const hashPart = hashIndex >= 0 ? url.slice(hashIndex + 1) : '';
  const queryPart =
    queryIndex >= 0
      ? url.slice(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined)
      : '';

  const absorb = (raw: string) => {
    if (!raw) return;
    raw.split('&').forEach((part) => {
      if (!part) return;
      const eq = part.indexOf('=');
      const key = decodeParam(eq >= 0 ? part.slice(0, eq) : part);
      const value = decodeParam(eq >= 0 ? part.slice(eq + 1) : '');
      if (key) params[key] = value;
    });
  };

  absorb(queryPart);
  absorb(hashPart);
  return params;
}

export function mapAuthCallbackError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('expired') || lower.includes('invalid')) {
    return 'El enlace expiró o ya fue usado. Solicita uno nuevo en Ajustes o en la pantalla de acceso.';
  }
  if (lower.includes('access_denied')) {
    return 'No pudimos confirmar tu correo. Intenta de nuevo desde la app.';
  }
  return message;
}

/** Completa sesión o confirmación de email al abrir el deep link en el dispositivo. */
export async function createSessionFromAuthUrl(url: string): Promise<AuthLinkNotice | null> {
  if (!supabase) return null;

  const params = parseAuthParams(url);

  if (params.error_description || params.error) {
    throw new Error(
      mapAuthCallbackError(decodeParam(params.error_description ?? params.error))
    );
  }

  if (params.token_hash && params.type && OTP_TYPES.has(params.type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.token_hash,
      type: params.type as EmailOtpType,
    });
    if (error) throw new Error(mapAuthCallbackError(error.message));

    if (params.type === 'email_change' || params.type === 'email') {
      return {
        type: 'success',
        message: 'Correo confirmado. Tu guardarropa queda protegido en esta cuenta.',
      };
    }
    return {
      type: 'success',
      message: 'Acceso confirmado. Bienvenido de nuevo a NAIM.',
    };
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw new Error(mapAuthCallbackError(error.message));

    const isEmailFlow = params.type === 'email_change' || params.type === 'email';
    return {
      type: 'success',
      message: isEmailFlow
        ? 'Correo confirmado. Tu guardarropa queda protegido en esta cuenta.'
        : 'Acceso confirmado. Bienvenido de nuevo a NAIM.',
    };
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw new Error(mapAuthCallbackError(error.message));
    return {
      type: 'success',
      message: 'Acceso confirmado. Bienvenido de nuevo a NAIM.',
    };
  }

  return null;
}

export function subscribeToAuthUrls(
  onSuccess: (notice: AuthLinkNotice) => void,
  onError: (message: string) => void
) {
  const handleUrl = (url: string | null) => {
    if (!url || !isAuthDeepLink(url)) return;
    void createSessionFromAuthUrl(url)
      .then((notice) => {
        if (notice) onSuccess(notice);
        else onSuccess({ type: 'success', message: 'Sesión actualizada correctamente.' });
      })
      .catch((err) => {
        onError(err instanceof Error ? err.message : 'No se pudo completar el acceso.');
      });
  };

  void Linking.getInitialURL().then(handleUrl);
  const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
  return () => subscription.remove();
}
