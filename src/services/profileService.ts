import type { Session } from '@supabase/supabase-js';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '../lib/supabase';
import { localUriToArrayBuffer } from '../utils/localUriToArrayBuffer';
import { deleteAllUserStorageFiles, extractStoragePath } from './imageStorageService';
import { getAuthRedirectUrl, isValidEmail, normalizeEmail } from './authService';

const PROFILE_BUCKET = 'garment-images';
const AVATAR_FOLDER = 'profile';
const AVATAR_MAX_PX = 512;
const AVATAR_JPEG_QUALITY = 0.78;

type ProfileMetadata = {
  display_name?: string;
  avatar_url?: string;
  avatar_storage_path?: string;
  avatar_updated_at?: number;
  style_preference?: string;
  climate_preference?: string;
  onboarding_completed?: boolean;
};

/** Redimensiona y comprime a JPEG — óptimo para avatares pequeños en Storage. */
async function prepareAvatarForUpload(localUri: string): Promise<string> {
  try {
    const result = await manipulateAsync(
      localUri,
      [{ resize: { width: AVATAR_MAX_PX } }],
      { compress: AVATAR_JPEG_QUALITY, format: SaveFormat.JPEG }
    );
    return result.uri;
  } catch (err) {
    console.warn('[NAIM] Compresión de avatar falló, subiendo original:', err);
    return localUri;
  }
}

function withVersionQuery(publicUrl: string, version: number): string {
  const base = publicUrl.split('?')[0];
  return `${base}?v=${version}`;
}

async function removePreviousAvatars(userId: string, keepPath: string): Promise<void> {
  if (!supabase) return;
  const folder = `${userId}/${AVATAR_FOLDER}`;
  const { data, error } = await supabase.storage.from(PROFILE_BUCKET).list(folder);
  if (error || !data?.length) return;

  const stale = data
    .filter((file) => file.name && `${folder}/${file.name}` !== keepPath)
    .map((file) => `${folder}/${file.name}`);

  if (stale.length > 0) {
    const { error: removeError } = await supabase.storage.from(PROFILE_BUCKET).remove(stale);
    if (removeError) {
      console.warn('[NAIM] No se pudieron borrar avatares anteriores:', removeError.message);
    }
  }
}

function storagePathFromPublicUrl(publicUrl: string): string | null {
  const extracted = extractStoragePath(publicUrl);
  if (!extracted) return null;
  return extracted.split('?')[0].split('#')[0];
}

/** URL lista para <Image /> — usa signed URL autenticada si hace falta. */
export async function resolveProfileImageUrl(
  storedUrl: string | null | undefined,
  storagePathOverride?: string | null
): Promise<string | null> {
  if (!supabase) return storedUrl?.trim() || null;

  const storagePath =
    storagePathOverride?.trim() ||
    (storedUrl?.trim() ? storagePathFromPublicUrl(storedUrl.trim()) : null);

  if (storagePath) {
    const { data, error } = await supabase.storage
      .from(PROFILE_BUCKET)
      .createSignedUrl(storagePath, 60 * 60);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  }

  const trimmed = storedUrl?.trim();
  return trimmed || null;
}

export async function getProfileFromSupabase(): Promise<{
  userId: string;
  displayName: string;
  avatarUrl: string;
  email: string | null;
  isAnonymous: boolean;
  emailConfirmed: boolean;
}> {
  if (!supabase) throw new Error('Supabase no configurado');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw new Error(`Auth: ${error.message}`);
  if (!user) throw new Error('Usuario no autenticado');

  const metadata = (user.user_metadata ?? {}) as ProfileMetadata;
  let avatarUrl = metadata.avatar_url ?? '';
  if (!avatarUrl && metadata.avatar_storage_path && supabase) {
    const { data } = supabase.storage
      .from(PROFILE_BUCKET)
      .getPublicUrl(metadata.avatar_storage_path);
    avatarUrl = data.publicUrl;
  }
  if (avatarUrl && metadata.avatar_updated_at && !avatarUrl.includes('?v=')) {
    avatarUrl = withVersionQuery(avatarUrl, metadata.avatar_updated_at);
  }

  const email = user.email ?? null;
  const isAnonymous = user.is_anonymous === true || !email;

  return {
    userId: user.id,
    displayName: metadata.display_name ?? '',
    avatarUrl,
    email,
    isAnonymous,
    emailConfirmed: Boolean(email && user.email_confirmed_at),
  };
}

/** Vincula el correo al user_id anónimo actual; Supabase envía email de confirmación. */
export function mapLinkEmailError(message: string): string {
  const msg = message.toLowerCase();

  if (
    msg.includes('already been registered') ||
    msg.includes('already registered') ||
    msg.includes('user already registered') ||
    msg.includes('email address is already registered') ||
    msg.includes('already exists')
  ) {
    return 'Este correo ya está en uso en otra cuenta NAIM. Si es tuyo, cierra sesión e inicia con el enlace mágico en la pantalla de acceso. Si eliminaste esa cuenta hace poco, espera unos minutos o usa otro correo.';
  }

  if (msg.includes('same email') || msg.includes('already confirmed')) {
    return 'Este correo ya está vinculado a tu cuenta actual.';
  }

  if (msg.includes('invalid email')) {
    return 'Introduce un correo electrónico válido.';
  }

  if (msg.includes('rate limit') || msg.includes('too many')) {
    return 'Demasiados intentos seguidos. Espera un momento e inténtalo de nuevo.';
  }

  return message.replace(/^vincular correo:\s*/i, '').trim();
}

export async function linkAnonymousAccount(email: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado');
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('Introduce un correo electrónico válido.');
  }

  const { error } = await supabase.auth.updateUser({
    email: normalized,
    options: { emailRedirectTo: getAuthRedirectUrl() },
  });
  if (error) throw new Error(mapLinkEmailError(error.message));
}

function mapMagicLinkError(message: string): string {
  if (message.includes('Signups not allowed')) {
    return 'No pudimos registrar ese correo. Activa los registros por email en Supabase o usa Continuar con NAIM para empezar.';
  }
  if (message.includes('User not found')) {
    return 'Este correo no está vinculado a una cuenta. Protégelo primero en Ajustes o usa Continuar con NAIM.';
  }
  return message;
}

/** Envía magic link OTP al correo para recuperar o crear acceso. */
export async function signInWithMagicLink(email: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado');
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('Introduce un correo electrónico válido.');
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
      shouldCreateUser: true,
    },
  });
  if (!error) return;

  // Fallback cuando Supabase tiene desactivado signup por OTP:
  // creamos sesión anónima y vinculamos el correo al mismo user_id.
  if (error.message.includes('Signups not allowed')) {
    await createAnonymousSession();
    await linkAnonymousAccount(normalized);
    return;
  }

  throw new Error(mapMagicLinkError(error.message));
}

export async function updateProfileName(displayName: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado');
  const trimmed = displayName.trim();
  const { error } = await supabase.auth.updateUser({
    data: { display_name: trimmed || null },
  });
  if (error) throw new Error(`Actualizar nombre: ${error.message}`);
}

export async function saveOnboardingProfile(input: {
  name: string;
  stylePreference: string;
  climatePreference: string;
}): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado');

  const trimmedName = input.name.trim();
  if (!trimmedName) throw new Error('El nombre es obligatorio para continuar.');

  const { error } = await supabase.auth.updateUser({
    data: {
      display_name: trimmedName,
      style_preference: input.stylePreference,
      climate_preference: input.climatePreference,
      onboarding_completed: true,
    },
  });
  if (error) throw new Error(`Onboarding: ${error.message}`);
}

async function removeAllAvatars(userId: string): Promise<void> {
  if (!supabase) return;
  const folder = `${userId}/${AVATAR_FOLDER}`;
  const { data, error } = await supabase.storage.from(PROFILE_BUCKET).list(folder);
  if (error || !data?.length) return;
  const paths = data.filter((f) => f.name).map((f) => `${folder}/${f.name}`);
  if (paths.length > 0) {
    await supabase.storage.from(PROFILE_BUCKET).remove(paths);
  }
}

export async function removeProfileImage(): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado');
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw new Error(`Auth: ${authError.message}`);
  if (!user) throw new Error('Usuario no autenticado');

  await removeAllAvatars(user.id);

  const { error } = await supabase.auth.updateUser({
    data: { avatar_url: null, avatar_updated_at: null },
  });
  if (error) throw new Error(`Quitar foto: ${error.message}`);
}

export async function uploadProfileImage(localUri: string): Promise<string> {
  if (!supabase) throw new Error('Supabase no configurado');
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(`Auth: ${authError.message}`);
  if (!user) throw new Error('Usuario no autenticado');

  const version = Date.now();
  const storagePath = `${user.id}/${AVATAR_FOLDER}/avatar-${version}.jpg`;
  const preparedUri = await prepareAvatarForUpload(localUri);
  const body = await localUriToArrayBuffer(preparedUri);

  const { error: uploadError } = await supabase.storage.from(PROFILE_BUCKET).upload(storagePath, body, {
    upsert: false,
    contentType: 'image/jpeg',
  });
  if (uploadError) throw new Error(`Storage: ${uploadError.message}`);

  await removePreviousAvatars(user.id, storagePath);

  const { data } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(storagePath);
  const avatarUrl = withVersionQuery(data.publicUrl, version);

  const { error: userUpdateError } = await supabase.auth.updateUser({
    data: {
      avatar_url: avatarUrl,
      avatar_storage_path: storagePath,
      avatar_updated_at: version,
    },
  });
  if (userUpdateError) throw new Error(`Actualizar perfil: ${userUpdateError.message}`);

  return avatarUrl;
}

export async function signOutCurrentUser(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`Cerrar sesión: ${error.message}`);
}

export async function createAnonymousSession(): Promise<Session> {
  if (!supabase) throw new Error('Supabase no configurado');
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw new Error(`Nueva sesión anónima: ${error.message}`);
  if (!data.session) throw new Error('No se pudo crear la sesión anónima.');
  return data.session;
}

export async function deleteCurrentAccount(): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado');

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw new Error(`Auth: ${authError.message}`);
  if (!user) throw new Error('Usuario no autenticado');

  await deleteAllUserStorageFiles(user.id);

  const { error } = await supabase.rpc('delete_my_account');
  if (error) {
    throw new Error(
      `No se pudo eliminar la cuenta automáticamente (${error.message}). Crea la función RPC "delete_my_account" en Supabase para habilitar esta acción.`
    );
  }
}
