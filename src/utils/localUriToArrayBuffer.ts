import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

function normalizeLocalUri(uri: string): string {
  if (uri.startsWith('/') && !uri.startsWith('//')) {
    return `file://${uri}`;
  }
  return uri;
}

function detectMime(uri: string, fallback = 'image/jpeg'): string {
  if (/\.png$/i.test(uri)) return 'image/png';
  if (/\.webp$/i.test(uri)) return 'image/webp';
  if (/\.heic$/i.test(uri) || /\.heif$/i.test(uri)) return 'image/heic';
  return fallback;
}

/** fetch → blob → arrayBuffer (compatible con Supabase Storage en Android nativo). */
async function readViaFetchBlob(uri: string): Promise<ArrayBuffer> {
  const normalized = normalizeLocalUri(uri);
  const response = await fetch(normalized);
  if (!response.ok) {
    throw new Error(`No se pudo leer la imagen: ${response.status}`);
  }
  const blob = await response.blob();
  return new Response(blob).arrayBuffer();
}

/** Fallback cuando fetch(file://…) falla en builds nativos de producción. */
async function readViaFileSystem(uri: string): Promise<ArrayBuffer> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const mime = detectMime(uri);
  const response = await fetch(`data:${mime};base64,${base64}`);
  const blob = await response.blob();
  return new Response(blob).arrayBuffer();
}

/**
 * Convierte una URI local (file://, content://, data:) en ArrayBuffer
 * listo para subir a Supabase Storage desde Android/iOS nativo.
 */
export async function localUriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const trimmed = uri.trim();
  if (!trimmed) throw new Error('URI de imagen vacía');

  if (trimmed.startsWith('data:')) {
    const response = await fetch(trimmed);
    const blob = await response.blob();
    return new Response(blob).arrayBuffer();
  }

  try {
    return await readViaFetchBlob(trimmed);
  } catch (fetchErr) {
    if (Platform.OS === 'web') {
      throw fetchErr instanceof Error ? fetchErr : new Error(String(fetchErr));
    }
    try {
      return await readViaFileSystem(trimmed);
    } catch {
      const msg =
        fetchErr instanceof Error ? fetchErr.message : 'Network request failed';
      throw new Error(`No se pudo leer la imagen local (${msg})`);
    }
  }
}
