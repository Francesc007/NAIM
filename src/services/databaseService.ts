import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Garment } from '../types/garment';
import { getOrCreateDeviceId, getGarmentsStorageKey } from './deviceIdService';

function rowToGarment(row: Record<string, unknown>): Garment {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    imagePath: String(row.image_path ?? ''),
    category: String(row.category ?? ''),
    subcategory: row.subcategory ? String(row.subcategory) : undefined,
    colors: Array.isArray(row.colors) ? (row.colors as string[]) : [],
    occasion: String(row.occasion ?? 'casual'),
    season: String(row.season ?? 'todo el año'),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    lastWornAt: row.last_worn_at ? String(row.last_worn_at) : undefined,
    wearCount: Number(row.wear_count ?? 0),
  };
}

function garmentToRow(g: Garment, userId: string | null) {
  const row: Record<string, unknown> = {
    id: g.id,
    name: g.name,
    image_path: g.imagePath,
    category: g.category,
    subcategory: g.subcategory ?? null,
    colors: g.colors ?? [],
    occasion: g.occasion,
    season: g.season,
    created_at: g.createdAt,
    last_worn_at: g.lastWornAt ?? null,
    wear_count: g.wearCount ?? 0,
  };
  if (userId) row.user_id = userId;
  return row;
}

export async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Sube el inventario de AsyncStorage a la tabla items de Supabase.
 */
export async function uploadInventoryToSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
  if (!supabase) {
    return { success: false, count: 0, error: 'Supabase no configurado' };
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, count: 0, error: 'Usuario no autenticado' };

    const deviceId = await getOrCreateDeviceId();
    const storageKey = getGarmentsStorageKey(deviceId);
    const raw = await AsyncStorage.getItem(storageKey);
    if (!raw) return { success: true, count: 0 };

    const list = JSON.parse(raw) as Garment[];
    if (!Array.isArray(list) || list.length === 0) return { success: true, count: 0 };

    const rows = list.map((g) => garmentToRow(g, userId));
    const { error } = await supabase.from('items').upsert(rows, { onConflict: 'id' });

    if (error) {
      return { success: false, count: 0, error: error.message };
    }
    return { success: true, count: rows.length };
  } catch (e) {
    return { success: false, count: 0, error: String(e) };
  }
}

/**
 * Obtiene el inventario desde la tabla items de Supabase.
 * Retorna [] si Supabase no está configurado o falla.
 */
export async function getInventoryFromSupabase(): Promise<Garment[]> {
  if (!supabase) return [];
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('[NAIM] Error leyendo de Supabase:', error.message);
      return [];
    }
    return (data ?? []).map(rowToGarment);
  } catch (e) {
    console.warn('[NAIM] Error getInventoryFromSupabase:', e);
    return [];
  }
}

/**
 * Guarda una prenda en Supabase. Lanza error si falla (no silencia).
 */
export async function saveGarmentToSupabase(garment: Garment): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado');
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;
  if (!userId) throw new Error('Usuario no autenticado (user_id es null)');
  const row = garmentToRow(garment, userId);
  const { error } = await supabase.from('items').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`Supabase: ${error.message}`);
}
