import { supabase } from '../lib/supabase';
import { getCurrentUserId } from './databaseService';

const BUCKET = 'garment-images';

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`No se pudo leer la imagen: ${response.status}`);
  return response.arrayBuffer();
}

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

export async function uploadGarmentImage(localUri: string, garmentId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase no configurado');
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Usuario no autenticado');

  const path = `${userId}/${garmentId}.jpg`;
  const body = await uriToArrayBuffer(localUri);

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
