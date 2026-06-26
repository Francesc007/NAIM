import { supabase } from '../lib/supabase';
import { localUriToArrayBuffer } from '../utils/localUriToArrayBuffer';
import { getCurrentUserId } from './databaseService';

const BUCKET = 'garment-images';
const LIST_PAGE_SIZE = 100;
const REMOVE_BATCH_SIZE = 100;

export function extractStoragePath(imagePath: string): string | null {
  if (!imagePath.includes(BUCKET)) return null;
  const marker = `/object/public/${BUCKET}/`;
  const idx = imagePath.indexOf(marker);
  if (idx !== -1) return decodeURIComponent(imagePath.slice(idx + marker.length));
  const privateMarker = `/object/${BUCKET}/`;
  const idx2 = imagePath.indexOf(privateMarker);
  if (idx2 !== -1) return decodeURIComponent(imagePath.slice(idx2 + privateMarker.length));
  return null;
}

function isStorageFolder(entry: { id: string | null; name: string | null }): boolean {
  return entry.id === null && Boolean(entry.name);
}

/** Lista recursivamente todos los archivos bajo un prefijo del bucket del usuario. */
async function collectStoragePaths(prefix: string): Promise<string[]> {
  if (!supabase) return [];

  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: LIST_PAGE_SIZE,
      offset,
    });
    if (error) throw new Error(`Storage list (${prefix}): ${error.message}`);
    if (!data?.length) break;

    for (const entry of data) {
      if (!entry.name) continue;
      const fullPath = `${prefix}/${entry.name}`;
      if (isStorageFolder(entry)) {
        const nested = await collectStoragePaths(fullPath);
        paths.push(...nested);
      } else {
        paths.push(fullPath);
      }
    }

    if (data.length < LIST_PAGE_SIZE) break;
    offset += LIST_PAGE_SIZE;
  }

  return paths;
}

/** Elimina todas las imágenes del usuario en Storage (prendas, avatares, etc.). */
export async function deleteAllUserStorageFiles(userId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado');

  const paths = await collectStoragePaths(userId);
  if (paths.length === 0) return;

  for (let i = 0; i < paths.length; i += REMOVE_BATCH_SIZE) {
    const batch = paths.slice(i, i + REMOVE_BATCH_SIZE);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) {
      throw new Error(`No se pudieron borrar imágenes de Storage: ${error.message}`);
    }
  }
}

export async function uploadGarmentImage(localUri: string, garmentId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase no configurado');
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Usuario no autenticado');

  const path = `${userId}/${garmentId}.jpg`;
  const body = await localUriToArrayBuffer(localUri);

  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    upsert: true,
    contentType: 'image/jpeg',
  });
  if (error) throw new Error(`Storage: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteGarmentImage(imagePath: string): Promise<void> {
  if (!supabase) return;
  const storagePath = extractStoragePath(imagePath);
  if (!storagePath) return;
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) console.warn('[NAIM] Error borrando imagen Storage:', error.message);
}
