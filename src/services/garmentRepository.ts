import AsyncStorage from '@react-native-async-storage/async-storage';
import { Garment } from '../types/garment';
import { getOrCreateDeviceId, getGarmentsStorageKey } from './deviceIdService';
import { saveImageForGarment } from '../utils/platformStorage';
import { uploadGarmentImage, deleteGarmentImage } from './imageStorageService';

const LEGACY_KEY = 'guardarropa_garments';

async function getStorageKey(): Promise<string> {
  const deviceId = await getOrCreateDeviceId();
  return getGarmentsStorageKey(deviceId);
}

async function loadGarments(): Promise<Garment[]> {
  try {
    const key = await getStorageKey();
    let raw = await AsyncStorage.getItem(key);
    if (!raw) {
      raw = await AsyncStorage.getItem(LEGACY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed) ? parsed : [];
        await AsyncStorage.setItem(key, JSON.stringify(list));
        return list;
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[NAIM] Error leyendo prendas:', error);
    return [];
  }
}

async function saveGarments(garments: Garment[]): Promise<void> {
  try {
    const key = await getStorageKey();
    await AsyncStorage.setItem(key, JSON.stringify(garments));
  } catch (error) {
    console.warn('[NAIM] Error guardando prendas:', error);
    throw error;
  }
}

export const garmentRepository = {
  async getAll(): Promise<Garment[]> {
    return loadGarments();
  },

  async save(garments: Garment[]): Promise<void> {
    await saveGarments(garments);
  },

  async add(garment: Garment): Promise<void> {
    const { saveGarmentToSupabase } = await import('./databaseService');

    let imagePath = garment.imagePath;
    try {
      if (!imagePath.startsWith('http')) {
        const localPath = imagePath.startsWith('file://') || imagePath.startsWith('/')
          ? imagePath
          : await saveImageForGarment(garment.imagePath, garment.id);
        imagePath = await uploadGarmentImage(localPath, garment.id);
      }
    } catch (err) {
      console.warn('[NAIM] Upload Storage falló, guardando ruta local:', err);
    }

    const garmentWithUrl: Garment = { ...garment, imagePath };
    await saveGarmentToSupabase(garmentWithUrl);
    const all = await this.getAll();
    all.push(garmentWithUrl);
    await saveGarments(all);
  },

  async update(garment: Garment): Promise<void> {
    const { updateGarmentInSupabase } = await import('./databaseService');
    try {
      await updateGarmentInSupabase(garment);
    } catch (err) {
      console.warn('[NAIM] Sync update Supabase:', err);
    }
    const all = await this.getAll();
    const i = all.findIndex((g) => g.id === garment.id);
    if (i >= 0) {
      all[i] = garment;
      await this.save(all);
    }
  },

  async delete(id: string): Promise<void> {
    const { deleteGarmentFromSupabase } = await import('./databaseService');
    const all = await this.getAll();
    const garment = all.find((g) => g.id === id);
    try {
      if (garment?.imagePath) {
        await deleteGarmentImage(garment.imagePath);
      }
      await deleteGarmentFromSupabase(id);
    } catch (err) {
      console.warn('[NAIM] Sync delete Supabase:', err);
    }
    const filtered = all.filter((g) => g.id !== id);
    await this.save(filtered);
  },

  async markWorn(id: string): Promise<void> {
    const all = await this.getAll();
    const g = all.find((x) => x.id === id);
    if (g) {
      g.lastWornAt = new Date().toISOString();
      g.wearCount = (g.wearCount || 0) + 1;
      await this.update(g);
    }
  },
};
