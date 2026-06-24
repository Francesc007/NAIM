import AsyncStorage from '@react-native-async-storage/async-storage';
import { Garment } from '../types/garment';
import { garmentRepository } from './garmentRepository';
import { getOutfitSuggestions } from './aiService';

export interface OutfitSuggestion {
  garments: Garment[];
  reason: string;
}

const CACHE_KEY_PREFIX = 'suggestion_cache_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

function getDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function getCachedSuggestion(occasion: string): Promise<OutfitSuggestion[] | null> {
  try {
    const key = `${CACHE_KEY_PREFIX}${getDateKey()}_${occasion}`;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { suggestions, cachedAt } = JSON.parse(raw);
    if (Date.now() - cachedAt > CACHE_TTL_MS) return null;
    return suggestions;
  } catch {
    return null;
  }
}

async function setCachedSuggestion(occasion: string, suggestions: OutfitSuggestion[]): Promise<void> {
  try {
    const key = `${CACHE_KEY_PREFIX}${getDateKey()}_${occasion}`;
    await AsyncStorage.setItem(
      key,
      JSON.stringify({
        suggestions,
        cachedAt: Date.now(),
      })
    );
  } catch {
    // ignorar fallos de caché
  }
}

/** Filtra prendas sin nombre o sin imagen válida. */
function filterValidGarments(garments: Garment[]): Garment[] {
  return garments.filter(
    (g) =>
      g &&
      typeof g.name === 'string' &&
      g.name.trim().length > 0 &&
      typeof g.imagePath === 'string' &&
      g.imagePath.trim().length > 0
  );
}

function normalizeForCompare(s: string): string {
  return (s || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Filtra prendas que coinciden con la ocasión seleccionada (case-insensitive, sin acentos). */
function filterByOccasion(garments: Garment[], occasion: string): Garment[] {
  const occ = normalizeForCompare(occasion);
  return garments.filter((g) => {
    const gOcc = normalizeForCompare(g.occasion || '');
    return gOcc === occ || gOcc.includes(occ) || occ.includes(gOcc);
  });
}

/** Contexto de clima opcional para adaptar sugerencias a la IA */
export interface WeatherContext {
  temp: number;
  condition: string;
}

export interface GenerateSuggestionsOptions {
  /** Si el usuario pide otra sugerencia: nueva llamada a la IA (sin caché). */
  previousReason?: string;
  /** 0 = primera combinación; al subir, alterna en la IA. */
  variationIndex?: number;
  /** Ignora caché y fuerza nueva llamada a Groq. */
  forceRefresh?: boolean;
  /** Inventario ya mezclado desde el cliente; si existe, se usa sin filtrar por ocasión. */
  garmentsOverride?: Garment[];
}

/**
 * Genera sugerencias: filtra por ocasión, llama a Groq con inventario y mapea IDs → prendas.
 */
export async function generateSuggestions(
  occasion = 'casual',
  weather?: WeatherContext,
  options?: GenerateSuggestionsOptions
): Promise<{ suggestions: OutfitSuggestion[]; error?: string }> {
  console.log('=== INICIO AUDITORÍA DE MOTOR ===');
  console.log('1. Total prendas recibidas del Front (garmentsOverride):', options?.garmentsOverride?.length || 0);

  const skipCache =
    Boolean(options?.forceRefresh) ||
    Boolean(options?.previousReason?.trim()) ||
    (options?.variationIndex ?? 0) > 0 ||
    Boolean(options?.garmentsOverride?.length);
  if (!skipCache) {
    const cached = await getCachedSuggestion(occasion);
    if (cached && cached.length > 0) {
      return { suggestions: cached };
    }
  }

  const { getInventoryFromSupabase } = await import('./databaseService');
  let all = await getInventoryFromSupabase();
  if (all.length < 1) {
    all = await garmentRepository.getAll();
  }

  const valid = filterValidGarments(all);
  if (valid.length < 1) return { suggestions: [] };

  let filtered: Garment[];

  if (options?.garmentsOverride && options.garmentsOverride.length > 0) {
    filtered = options.garmentsOverride;
  } else {
    filtered = filterByOccasion(valid, occasion);
    if (filtered.length < 1) {
      return {
        suggestions: [],
        error: `No tienes prendas para ocasión "${occasion}". Añade ropa etiquetada para esta ocasión.`,
      };
    }
    filtered = [...filtered].sort(() => Math.random() - 0.5);
  }

  console.log('2. Prendas disponibles después del filtro de clima:', filtered.length);
  console.log('3. IDs listos para enviar a Groq:', filtered.map((g) => g.id));

  const result = await getOutfitSuggestions(filtered, occasion, weather);

  if ('error' in result) {
    const cached = await getCachedSuggestion(occasion);
    if (cached && cached.length > 0) {
      return {
        suggestions: cached,
        error:
          'Mostrando sugerencias guardadas. El Stylist no respondió; pulsa «Tres opciones nuevas» para reintentar.',
      };
    }
    return { suggestions: [], error: result.error };
  }

  // Mapeo robusto: busca primero en el set realmente enviado (filtered) y luego en valid.
  const lookup = new Map<string, Garment>();
  for (const g of valid) lookup.set(g.id, g);
  for (const g of filtered) lookup.set(g.id, g);

  const finalSuggestions: OutfitSuggestion[] = result.suggestions.map((s) => ({
    garments: s.garmentIds
      .map((id) => lookup.get(id))
      .filter(Boolean) as Garment[],
    reason: s.reason,
  }));

  await setCachedSuggestion(occasion, finalSuggestions);

  return { suggestions: finalSuggestions };
}
