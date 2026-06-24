import { Platform } from 'react-native';
import { GARMENT_TYPES, OCCASIONS, SEASONS } from '../config/categories';
import {
  getGroqApiKey,
  GROQ_CHAT_COMPLETIONS_URL,
  GROQ_VISION_MODEL,
} from '../config/groq';
import { fetchGroqWithRetry, groqErrorMessage } from './groqClient';

export interface ClassificationResult {
  category: string;
  subcategory?: string;
  colors: string[];
  occasion: string;
  season: string;
  suggestedName: string;
}

/**
 * Clasificación de prendas por IA (visión) con Groq — misma API key que sugerencias de outfit.
 * Sin clave o si falla la petición: valores por defecto.
 */
export async function classifyImage(imageUri: string): Promise<ClassificationResult> {
  const apiKey = getGroqApiKey();

  if (apiKey) {
    try {
      return await classifyWithGroq(imageUri, apiKey);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[NAIM] Clasificación IA (Groq visión):', msg);
      return getDefaultClassification();
    }
  }

  console.warn('[NAIM] Clasificación IA: sin EXPO_PUBLIC_GROQ_API_KEY');
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

/** Extrae JSON del texto del modelo (puede venir con ```json```). */
function parseJsonFromModelContent(content: string): Record<string, unknown> {
  const cleaned = content.replace(/```\w*\n?/g, '').trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as Record<string, unknown>;
      } catch {
        /* ignore */
      }
    }
    throw new Error('Respuesta no es JSON válido');
  }
}

async function classifyWithGroq(
  imageUri: string,
  apiKey: string
): Promise<ClassificationResult> {
  const dataUrl = await uriToDataUrl(imageUri);

  const response = await fetchGroqWithRetry(GROQ_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
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
      max_completion_tokens: 1024,
      temperature: 0.3,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg =
      (data as { error?: { message?: string } })?.error?.message ??
      (data as { message?: string })?.message;
    throw new Error(groqErrorMessage(response.status, msg));
  }

  const content = (data as { choices?: { message?: { content?: string } }[] })
    ?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('Respuesta vacía de Groq (visión)');
  }

  const parsed = parseJsonFromModelContent(content);

  return {
    category: validateCategory(parsed.category as string | undefined),
    subcategory: parsed.subcategory as string | undefined,
    colors: Array.isArray(parsed.colors)
      ? (parsed.colors as string[]).slice(0, 3)
      : ['negro'],
    occasion: validateOccasion(parsed.occasion as string | undefined),
    season: validateSeason(parsed.season as string | undefined),
    suggestedName:
      typeof parsed.suggestedName === 'string' ? parsed.suggestedName : 'Prenda',
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
