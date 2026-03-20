/**
 * ID único por dispositivo — multi-usuario sin login.
 * Se genera la primera vez que se abre la app y se guarda en AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuid } from 'uuid';

const DEVICE_ID_KEY = '@naim_device_id';

let cachedId: string | null = null;

export async function getOrCreateDeviceId(): Promise<string> {
  if (cachedId) return cachedId;
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = uuid();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  cachedId = id;
  return id;
}

export function getGarmentsStorageKey(deviceId: string): string {
  return `@naim_garments_${deviceId}`;
}
