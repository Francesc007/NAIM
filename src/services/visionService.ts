/**
 * Análisis de imágenes de prendas con Gemini Vision (gemini-2.0-flash)
 */

import { Platform } from 'react-native';
import { env } from '../utils/env';

const API_KEY = env.GEMINI_API_KEY ?? process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface VisionAnalysisResult {
  categoria: 'camiseta' | 'pantalón' | 'falda' | 'vestido' | 'chamarra' | 'calzado' | 'accesorio';
  color: string;
  ocasion: 'casual' | 'formal' | 'deportivo' | 'trabajo' | 'ocasión especial';
  estacion: 'primavera' | 'verano' | 'otoño' | 'invierno' | 'todo el año';
  suggestedName?: string;
}

export async function analyzeGarmentImage(
  base64Image: string
): Promise<VisionAnalysisResult | null> {
  if (!API_KEY) {
    console.warn('[NAIM] Gemini API key no encontrada. Revisa .env.');
    return null;
  }

  const { mimeType, data: base64Clean } = parseBase64Image(base64Image);

  const prompt = `Analiza esta imagen de una prenda de ropa. Responde ÚNICAMENTE con JSON válido, sin markdown ni explicaciones.

REGLAS ESTRICTAS — usa EXACTAMENTE estas opciones (respeta mayúsculas y acentos):

- categoria: UNA de: Camiseta, Pantalón, Falda, Vestido, Chamarra, Calzado, Accesorio
- color: color principal en español (ej: negro, blanco, azul)
- ocasion: UNA de: Casual, Formal, Deportivo, Trabajo, Ocasión Especial
- estacion: UNA de: Primavera, Verano, Otoño, Invierno, Todo El Año
- suggestedName: nombre corto descriptivo en español (ej: Camiseta negra básica)

Ejemplo de respuesta:
{"categoria":"Camiseta","color":"negro","ocasion":"Casual","estacion":"Todo El Año","suggestedName":"Camiseta negra básica"}`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Clean,
                },
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    const data = await res.json();
    console.log('[NAIM] Respuesta completa de Gemini:', JSON.stringify(data, null, 2));

    if (!res.ok) {
      console.warn('[NAIM] Gemini API error:', res.status, data);
      throw new Error(`Error de API: ${res.status}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      console.warn('[NAIM] Gemini no devolvió texto:', data);
      throw new Error('La IA no pudo analizar la imagen');
    }

    const cleaned = text.replace(/```\w*\n?/g, '').trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn('[NAIM] JSON inválido de Gemini:', text);
      throw new Error('Formato de respuesta no válido');
    }

    return {
      categoria: validateCategoria(parsed.categoria as string | undefined),
      color: String(parsed.color || 'negro').toLowerCase(),
      ocasion: validateOcasion(parsed.ocasion as string | undefined),
      estacion: validateEstacion(parsed.estacion as string | undefined),
      suggestedName: String(parsed.suggestedName || 'Prenda'),
    };
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Error desconocido al analizar la imagen');
  }
}

const CATEGORIAS = ['camiseta', 'pantalón', 'falda', 'vestido', 'chamarra', 'calzado', 'accesorio'] as const;
const OCASIONES = ['casual', 'formal', 'deportivo', 'trabajo', 'ocasión especial'] as const;
const ESTACIONES = ['primavera', 'verano', 'otoño', 'invierno', 'todo el año'] as const;

function parseBase64Image(base64Image: string): { mimeType: string; data: string } {
  const match = base64Image.match(/^data:(image\/(jpeg|jpg|png));base64,(.+)$/i);
  if (match) {
    const mime = match[2].toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';
    return { mimeType: mime, data: match[3] };
  }
  const data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  return { mimeType: 'image/jpeg', data };
}

function validateCategoria(c: string | undefined): VisionAnalysisResult['categoria'] {
  const v = String(c || '').toLowerCase().trim();
  const found = CATEGORIAS.find((x) => v === x || v.includes(x.replace('ó', 'o')));
  if (found) return found;
  if (v.includes('camiseta') || v.includes('blusa') || v.includes('playera') || v.includes('top')) return 'camiseta';
  if (v.includes('pantal') || v.includes('bottom')) return 'pantalón';
  if (v.includes('falda')) return 'falda';
  if (v.includes('vestido')) return 'vestido';
  if (v.includes('chamarra') || v.includes('abrigo') || v.includes('saco')) return 'chamarra';
  if (v.includes('calzado') || v.includes('zapato') || v.includes('tenis')) return 'calzado';
  if (v.includes('accesorio')) return 'accesorio';
  return 'camiseta';
}

function validateOcasion(o: string | undefined): VisionAnalysisResult['ocasion'] {
  const v = String(o || '').toLowerCase().trim();
  const found = OCASIONES.find((x) => v === x || v.includes(x.replace('ó', 'o')));
  return found ?? 'casual';
}

function validateEstacion(e: string | undefined): VisionAnalysisResult['estacion'] {
  const v = String(e || '').toLowerCase().trim();
  const found = ESTACIONES.find((x) => v === x || v.includes(x.replace('ñ', 'n')));
  return found ?? 'todo el año';
}

async function uriToBase64(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return uri;
  if (Platform.OS === 'web' && uri.startsWith('blob:')) {
    const res = await fetch(uri);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  const FileSystem = require('expo-file-system/legacy');
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const isPng = /\.png$/i.test(uri);
  const mime = isPng ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${base64}`;
}

/** Analiza una imagen desde URI (file:// o blob:) */
export async function analyzeGarmentImageFromUri(
  imageUri: string
): Promise<VisionAnalysisResult | null> {
  try {
    const base64 = await uriToBase64(imageUri);
    return await analyzeGarmentImage(base64);
  } catch (err) {
    console.warn('[NAIM] Error convirtiendo imagen a base64:', err);
    throw new Error('Formato de imagen no soportado');
  }
}
