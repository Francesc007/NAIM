import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

/**
 * Guarda una imagen y devuelve la URI para almacenar.
 * En web: usa la URI directamente (blob o data URL).
 * En nativo: copia al directorio de documentos.
 */
export async function saveImageForGarment(
  sourceUri: string,
  id: string
): Promise<string> {
  if (isWeb) {
    return sourceUri;
  }

  const FileSystem = require('expo-file-system/legacy');
  const destDir = `${FileSystem.documentDirectory ?? ''}garment_images/`;
  const exists = await FileSystem.getInfoAsync(destDir);
  if (!exists.exists) {
    await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
  }

  const ext = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
  const destPath = `${destDir}${id}.${ext}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destPath });
  return destPath;
}
