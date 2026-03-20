import AsyncStorage from '@react-native-async-storage/async-storage';
import { Garment } from '../types/garment';
import { getOrCreateDeviceId, getGarmentsStorageKey } from './deviceIdService';

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
    await saveGarmentToSupabase(garment);
    const all = await this.getAll();
    all.push(garment);
    await saveGarments(all);
  },

  async update(garment: Garment): Promise<void> {
    const all = await this.getAll();
    const i = all.findIndex((g) => g.id === garment.id);
    if (i >= 0) {
      all[i] = garment;
      await this.save(all);
    }
  },

  async delete(id: string): Promise<void> {
    const all = (await this.getAll()).filter((g) => g.id !== id);
    await this.save(all);
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
