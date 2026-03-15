import { Platform } from 'react-native';
import { GARMENT_TYPES, OCCASIONS, SEASONS } from '../config/categories';

export interface ClassificationResult {
  category: string;
  subcategory?: string;
  colors: string[];
  occasion: string;
  season: string;
  suggestedName: string;
}

/**
 * Clasificación de prendas por IA
 * MVP: con EXPO_PUBLIC_OPENAI_API_KEY usa OpenAI Vision; si no, valores por defecto
 */
export async function classifyImage(imageUri: string): Promise<ClassificationResult> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (apiKey) {
    try {
      return await classifyWithOpenAI(imageUri, apiKey);
    } catch {
      return getDefaultClassification();
    }
  }

  return getDefaultClassification();
}

async function uriToDataUrl(uri: string): Promise<string> {
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
  return `data:image/jpeg;base64,${base64}`;
}

async function classifyWithOpenAI(
  imageUri: string,
  apiKey: string
): Promise<ClassificationResult> {
  const dataUrl = await uriToDataUrl(imageUri);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analiza esta imagen de una prenda. Responde ÚNICAMENTE con JSON válido:
{
  "category": "una de: ${GARMENT_TYPES.join(', ')}",
  "subcategory": "opcional",
  "colors": ["lista de colores en español"],
  "occasion": "una de: ${OCCASIONS.join(', ')}",
  "season": "una de: ${SEASONS.join(', ')}",
  "suggestedName": "nombre corto en español"
}`,
            },
            {
              type: 'image_url',
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      max_tokens: 300,
    }),
  });

  if (!response.ok) throw new Error('OpenAI request failed');

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '{}';
  const cleaned = content.replace(/```\w*\n?/g, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    category: validateCategory(parsed.category),
    subcategory: parsed.subcategory,
    colors: Array.isArray(parsed.colors) ? parsed.colors.slice(0, 3) : ['negro'],
    occasion: validateOccasion(parsed.occasion),
    season: validateSeason(parsed.season),
    suggestedName: parsed.suggestedName ?? 'Prenda',
  };
}

function getDefaultClassification(): ClassificationResult {
  return {
    category: 'camiseta',
    colors: ['negro'],
    occasion: 'casual',
    season: 'todo el año',
    suggestedName: 'Prenda',
  };
}

function validateCategory(c: string | undefined): string {
  if (!c) return GARMENT_TYPES[0];
  const lower = String(c).toLowerCase();
  const found = GARMENT_TYPES.find((t) => lower.includes(t));
  return found ?? GARMENT_TYPES[0];
}

function validateOccasion(o: string | undefined): string {
  if (!o) return 'casual';
  const lower = String(o).toLowerCase();
  const found = OCCASIONS.find((x) => lower.includes(x));
  return found ?? 'casual';
}

function validateSeason(s: string | undefined): string {
  if (!s) return 'todo el año';
  const lower = String(s).toLowerCase();
  const found = SEASONS.find((x) => lower.includes(x));
  return found ?? 'todo el año';
}
