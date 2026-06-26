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

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  avatar_storage_path: string | null;
  avatar_updated_at: number | null;
  style_preference: string | null;
  climate_preference: string | null;
  onboarding_completed: boolean;
};

function metadataToProfilePatch(metadata: ProfileMetadata): Partial<Omit<ProfileRow, 'id'>> {
  return {
    display_name: metadata.display_name?.trim() ?? '',
    avatar_url: metadata.avatar_url?.trim() || null,
    avatar_storage_path: metadata.avatar_storage_path?.trim() || null,
    avatar_updated_at:
      typeof metadata.avatar_updated_at === 'number' ? metadata.avatar_updated_at : null,
    style_preference: metadata.style_preference?.trim() || null,
    climate_preference: metadata.climate_preference?.trim() || null,
    onboarding_completed: metadata.onboarding_completed === true,
  };
}

async function fetchProfileRow(userId: string): Promise<ProfileRow | null> {
  if (!supabase) throw new Error('Supabase no configurado');
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, display_name, avatar_url, avatar_storage_path, avatar_updated_at, style_preference, climate_preference, onboarding_completed'
    )
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(`Perfil: ${error.message}`);
  return data as ProfileRow | null;
}

async function upsertProfileRow(userId: string, patch: Partial<Omit<ProfileRow, 'id'>>): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado');
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      ...patch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(`Perfil: ${error.message}`);
}

async function ensureProfileRow(userId: string, metadata?: ProfileMetadata): Promise<ProfileRow> {
  const existing = await fetchProfileRow(userId);
  if (existing) return existing;

  const backfill = metadata ? metadataToProfilePatch(metadata) : {};
  await upsertProfileRow(userId, backfill);

  const created = await fetchProfileRow(userId);
  if (!created) throw new Error('No se pudo crear el perfil.');
  return created;
}

function resolveAvatarUrlFromRow(row: ProfileRow): string {
  let avatarUrl = row.avatar_url?.trim() ?? '';
  if (!avatarUrl && row.avatar_storage_path && supabase) {
    const { data } = supabase.storage
      .from(PROFILE_BUCKET)
      .getPublicUrl(row.avatar_storage_path);
    avatarUrl = data.publicUrl;
  }
  if (avatarUrl && row.avatar_updated_at && !avatarUrl.includes('?v=')) {
    avatarUrl = withVersionQuery(avatarUrl, row.avatar_updated_at);
  }
  return avatarUrl;
}

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
  avatarStoragePath: string | null;
  stylePreference: string;
  climatePreference: string;
  onboardingCompleted: boolean;
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
  const row = await ensureProfileRow(user.id, metadata);
  const avatarUrl = resolveAvatarUrlFromRow(row);

  const email = user.email ?? null;
  const isAnonymous = user.is_anonymous === true || !email;

  return {
    userId: user.id,
    displayName: row.display_name ?? '',
    avatarUrl,
    avatarStoragePath: row.avatar_storage_path,
    stylePreference: row.style_preference ?? '',
    climatePreference: row.climate_preference ?? '',
    onboardingCompleted: row.onboarding_completed === true,
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
    return 'Este correo ya está en uso en otra cuenta NAIM. Si es tuyo, inicia sesión con tu correo y contraseña.';
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

export async function linkAnonymousAccount(
  email: string,
  password?: string
): Promise<{ email: string; emailConfirmed: boolean }> {
  if (!supabase) throw new Error('Supabase no configurado');
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('Introduce un correo electrónico válido.');
  }
  if (password !== undefined && password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  const { error } = await supabase.auth.updateUser({
    email: normalized,
    ...(password ? { password } : {}),
    options: { emailRedirectTo: getAuthRedirectUrl() },
  });
  if (error) throw new Error(mapLinkEmailError(error.message));

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw new Error(`Auth: ${userError.message}`);

  return {
    email: user?.email ?? normalized,
    emailConfirmed: Boolean(user?.email && user.email_confirmed_at),
  };
}

function mapSignInError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirma tu correo en Supabase o desactiva la confirmación obligatoria en el panel de Auth.';
  }
  if (lower.includes('user not found')) {
    return 'Este correo no tiene cuenta NAIM. Usa Crear cuenta para empezar.';
  }
  return message;
}

/** Inicio de sesión inmediato con correo y contraseña. */
export async function signInWithEmailPassword(email: string, password: string): Promise<Session> {
  if (!supabase) throw new Error('Supabase no configurado');
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('Introduce un correo electrónico válido.');
  }
  if (!password.trim()) {
    throw new Error('Introduce tu contraseña.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  });
  if (error) throw new Error(mapSignInError(error.message));
  if (!data.session) throw new Error('No se pudo iniciar sesión.');
  return data.session;
}

function mapMagicLinkError(message: string): string {
  if (message.includes('Signups not allowed')) {
    return 'No pudimos registrar ese correo. Activa los registros por email en Supabase o usa Continuar con NAIM para empezar.';
  }
  if (message.includes('User not found')) {
    return 'Este correo no tiene cuenta NAIM. Usa Crear cuenta para empezar.';
  }
  return message;
}

/** Envía magic link OTP al correo para iniciar sesión en cuenta existente. */
export async function signInWithMagicLink(
  email: string,
  options?: { shouldCreateUser?: boolean }
): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado');
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('Introduce un correo electrónico válido.');
  }

  const shouldCreateUser = options?.shouldCreateUser ?? false;

  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
      shouldCreateUser,
    },
  });
  if (!error) return;

  if (error.message.includes('Signups not allowed') && shouldCreateUser) {
    await createAnonymousSession();
    await linkAnonymousAccount(normalized);
    return;
  }

  throw new Error(mapMagicLinkError(error.message));
}

export async function updateProfileName(displayName: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado');
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw new Error(`Auth: ${authError.message}`);
  if (!user) throw new Error('Usuario no autenticado');

  const trimmed = displayName.trim();
  await upsertProfileRow(user.id, { display_name: trimmed });
}

export async function saveOnboardingProfile(input: {
  name: string;
  stylePreference: string;
  climatePreference: string;
}): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado');

  const trimmedName = input.name.trim();
  if (!trimmedName) throw new Error('El nombre es obligatorio para continuar.');

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw new Error(`Auth: ${authError.message}`);
  if (!user) throw new Error('Usuario no autenticado');

  await upsertProfileRow(user.id, {
    display_name: trimmedName,
    style_preference: input.stylePreference,
    climate_preference: input.climatePreference,
    onboarding_completed: true,
  });
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

  await upsertProfileRow(user.id, {
    avatar_url: null,
    avatar_storage_path: null,
    avatar_updated_at: null,
  });
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

  await upsertProfileRow(user.id, {
    avatar_url: avatarUrl,
    avatar_storage_path: storagePath,
    avatar_updated_at: version,
  });

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
