import { supabase } from '../lib/supabase';

const PROFILE_IMAGE_PATH = 'profile/avatar.jpg';
const PROFILE_BUCKET = 'garment-images';

type ProfileMetadata = {
  display_name?: string;
  avatar_url?: string;
};

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`No se pudo leer la imagen: ${response.status}`);
  return response.arrayBuffer();
}

export async function getProfileFromSupabase(): Promise<{
  userId: string;
  displayName: string;
  avatarUrl: string;
}> {
  if (!supabase) throw new Error('Supabase no configurado');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw new Error(`Auth: ${error.message}`);
  if (!user) throw new Error('Usuario no autenticado');

  const metadata = (user.user_metadata ?? {}) as ProfileMetadata;
  return {
    userId: user.id,
    displayName: metadata.display_name ?? '',
    avatarUrl: metadata.avatar_url ?? '',
  };
}

export async function updateProfileName(displayName: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado');
  const trimmed = displayName.trim();
  const { error } = await supabase.auth.updateUser({
    data: { display_name: trimmed || null },
  });
  if (error) throw new Error(`Actualizar nombre: ${error.message}`);
}

export async function uploadProfileImage(localUri: string): Promise<string> {
  if (!supabase) throw new Error('Supabase no configurado');
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(`Auth: ${authError.message}`);
  if (!user) throw new Error('Usuario no autenticado');

  const path = `${user.id}/${PROFILE_IMAGE_PATH}`;
  const body = await uriToArrayBuffer(localUri);

  const { error: uploadError } = await supabase.storage.from(PROFILE_BUCKET).upload(path, body, {
    upsert: true,
    contentType: 'image/jpeg',
  });
  if (uploadError) throw new Error(`Storage: ${uploadError.message}`);

  const { data } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(path);
  const avatarUrl = data.publicUrl;

  const { error: userUpdateError } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });
  if (userUpdateError) throw new Error(`Actualizar perfil: ${userUpdateError.message}`);

  return avatarUrl;
}

export async function signOutCurrentUser(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`Cerrar sesión: ${error.message}`);
}

export async function createAnonymousSession(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw new Error(`Nueva sesión anónima: ${error.message}`);
}

export async function deleteCurrentAccount(): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado');
  const { error } = await supabase.rpc('delete_my_account');
  if (error) {
    throw new Error(
      `No se pudo eliminar la cuenta automáticamente (${error.message}). Crea la función RPC "delete_my_account" en Supabase para habilitar esta acción.`
    );
  }
}
