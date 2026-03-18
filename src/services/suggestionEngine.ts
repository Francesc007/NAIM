import AsyncStorage from '@react-native-async-storage/async-storage';
import { Garment } from '../types/garment';
import { garmentRepository } from './garmentRepository';
import { getOutfitSuggestion, GarmentForPrompt } from './aiService';

export interface OutfitSuggestion {
  garments: Garment[];
  reason: string;
}

const CACHE_KEY_PREFIX = 'suggestion_cache_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

/** Categorías: superior, inferior, calzado */
const CAT_TOP = ['camiseta', 'chamarra', 'vestido'];
const CAT_BOTTOM = ['pantalón', 'falda'];
const CAT_SHOES = ['calzado'];

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
    await AsyncStorage.setItem(key, JSON.stringify({
      suggestions,
      cachedAt: Date.now(),
    }));
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

function normCat(c: string): string {
  return (c || '').toLowerCase().trim();
}

/** Selecciona 1 superior, 1 inferior y 1 calzado. Vestido cuenta como superior+inferior. */
function selectThreePieces(garments: Garment[]): { selected: Garment[]; missing: string[] } {
  const tops = garments.filter((g) => CAT_TOP.includes(normCat(g.category)));
  const bottoms = garments.filter((g) => CAT_BOTTOM.includes(normCat(g.category)));
  const shoes = garments.filter((g) => CAT_SHOES.includes(normCat(g.category)));

  const selected: Garment[] = [];
  const missing: string[] = [];

  // Vestido reemplaza top + bottom
  const vestidos = garments.filter((g) => normCat(g.category) === 'vestido');
  if (vestidos.length > 0) {
    selected.push(vestidos[0]);
    if (shoes.length > 0) {
      selected.push(shoes[0]);
      return { selected, missing: [] };
    }
    return { selected, missing: ['Calzado'] };
  }

  if (tops.length > 0) selected.push(tops[0]);
  else missing.push('parte superior (camiseta, chamarra)');

  if (bottoms.length > 0) selected.push(bottoms[0]);
  else missing.push('parte inferior (pantalón, falda)');

  if (shoes.length > 0) selected.push(shoes[0]);
  else missing.push('calzado');

  return { selected, missing };
}

function toGarmentForPrompt(g: Garment): GarmentForPrompt {
  return {
    name: g.name.trim(),
    category: g.category || '',
    occasion: g.occasion || '',
    season: g.season || '',
  };
}

/** Contexto de clima opcional para adaptar sugerencias a la IA */
export interface WeatherContext {
  temp: number;
  condition: string;
}

/**
 * Genera una sugerencia: filtra por ocasión, aplica regla de 3 piezas, llama a Groq.
 * Si se pasa weather, Groq adapta (ej: no bermudas si hace 10°C).
 */
export async function generateSuggestions(
  occasion = 'casual',
  weather?: WeatherContext
): Promise<{ suggestions: OutfitSuggestion[]; error?: string }> {
  const cached = await getCachedSuggestion(occasion);
  if (cached && cached.length > 0) {
    return { suggestions: cached };
  }

  const { getInventoryFromSupabase } = await import('./databaseService');
  let all = await getInventoryFromSupabase();
  if (all.length < 1) {
    all = await garmentRepository.getAll();
  }

  const valid = filterValidGarments(all);
  if (valid.length < 1) return { suggestions: [] };

  // 1. Filtrar por ocasión seleccionada
  let filtered = filterByOccasion(valid, occasion);
  if (filtered.length < 1) {
    return {
      suggestions: [],
      error: `No tienes prendas para ocasión "${occasion}". Añade ropa etiquetada para esta ocasión.`,
    };
  }

  // 2. Regla de 3 piezas: 1 superior, 1 inferior, 1 calzado
  const { selected, missing } = selectThreePieces(filtered);
  if (missing.length > 0) {
    return {
      suggestions: [],
      error: `Faltan prendas: ${missing.join(', ')}. Añade al menos una de cada tipo para esta ocasión.`,
    };
  }

  const forPrompt = selected.map(toGarmentForPrompt);
  const result = await getOutfitSuggestion(forPrompt, occasion, weather);

  if ('error' in result) {
    return { suggestions: [], error: result.error };
  }

  const suggestions: OutfitSuggestion[] = [{ garments: selected, reason: result.text }];
  await setCachedSuggestion(occasion, suggestions);

  return { suggestions };
}
