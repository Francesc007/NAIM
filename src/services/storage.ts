import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

const STORAGE_KEY = 'guardarropa_garments';

export const storage = {
  async get(key: string): Promise<string | null> {
    if (isWeb && typeof localStorage !== 'undefined') {
      return Promise.resolve(localStorage.getItem(key));
    }
    return Promise.resolve(null);
  },

  async set(key: string, value: string): Promise<void> {
    if (isWeb && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setJson(key: string, value: unknown): Promise<void> {
    await this.set(key, JSON.stringify(value));
  },
};
