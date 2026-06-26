import { Garment } from '../types/garment';
import { getGroqApiKey, GROQ_CHAT_COMPLETIONS_URL } from '../config/groq';
import { fetchGroqWithRetry, groqErrorMessage } from './groqClient';
import { supabase } from '../lib/supabase';

export interface OutfitSuggestionResponse {
  suggestions: {
    garmentIds: string[];
    reason: string;
  }[];
}

const GROQ_URL = GROQ_CHAT_COMPLETIONS_URL || 'https://api.groq.com/openai/v1/chat/completions';
const MAX_SUGGESTIONS = 3;
const HOT_TEMP_C = 28;

type ProfileGender = 'women' | 'men' | 'unknown';
type OutfitSlot = 'top' | 'bottom' | 'footwear' | 'onepiece' | 'layer' | 'accessory';

type WeatherRules = {
  isHot: boolean;
  isCloudy: boolean;
  isSunny: boolean;
};

type InventoryBucket = Record<OutfitSlot, Garment[]>;

function normalizeForCompare(s: string): string {
  return (s || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function includesAny(text: string, values: string[]): boolean {
  return values.some((value) => text.includes(value));
}

function garmentText(g: Garment): string {
  return normalizeForCompare(`${g.category} ${g.subcategory ?? ''} ${g.name}`);
}

function weatherFlags(weather?: { temp: number; condition: string }): WeatherRules {
  const temp = weather?.temp;
  const condition = normalizeForCompare(weather?.condition ?? '');
  const isCloudy = includesAny(condition, ['nube', 'cloud', 'overcast', 'mist', 'bruma']);
  const isSunny = includesAny(condition, ['sol', 'sun', 'clear', 'despejado']);
  return {
    isHot: typeof temp === 'number' && temp >= HOT_TEMP_C,
    isCloudy,
    isSunny,
  };
}

function isTop(g: Garment): boolean {
  const t = garmentText(g);
  return includesAny(t, ['camiseta', 'playera', 'camisa', 'blusa', 'top', 'polo']);
}

function isBottom(g: Garment): boolean {
  const t = garmentText(g);
  return includesAny(t, ['pantalon', 'jean', 'short', 'falda', 'pants', 'bermuda']);
}

function isOnePiece(g: Garment): boolean {
  const t = garmentText(g);
  return includesAny(t, ['vestido', 'jumpsuit', 'romper', 'mono', 'enterizo']);
}

function isLayer(g: Garment): boolean {
  const t = garmentText(g);
  return includesAny(t, [
    'chamarra',
    'sueter',
    'saco',
    'chaleco',
    'blazer',
    'cardigan',
    'abrigo',
    'ensamble',
    'hoodie',
  ]);
}

function isFootwear(g: Garment): boolean {
  const t = garmentText(g);
  return includesAny(t, ['calzado', 'tenis', 'zapato', 'bota', 'sandalia', 'tacon']);
}

function isAccessory(g: Garment): boolean {
  const t = garmentText(g);
  return includesAny(t, [
    'accesorio',
    'bolso',
    'joyeria',
    'reloj',
    'collar',
    'pulsera',
    'anillo',
    'gorra',
    'sombrero',
    'boina',
    'lentes',
    'gafas',
  ]);
}

function isEyewear(g: Garment): boolean {
  return includesAny(garmentText(g), ['lentes', 'gafas', 'sunglass']);
}

function isWinterHat(g: Garment): boolean {
  return includesAny(garmentText(g), ['gorro', 'beanie', 'winter hat']);
}

function isDisallowedByWeather(g: Garment, flags: WeatherRules): boolean {
  if (flags.isCloudy && isEyewear(g)) return true;
  if (flags.isHot && (isLayer(g) || isWinterHat(g))) return true;
  return false;
}

function inferGenderFromInventory(inventory: Garment[]): ProfileGender {
  const hasWomenSignals = inventory.some((g) => includesAny(garmentText(g), ['vestido', 'falda', 'blusa']));
  if (hasWomenSignals) return 'women';
  return 'men';
}

function parseGender(raw: unknown): ProfileGender {
  const value = normalizeForCompare(String(raw ?? ''));
  if (includesAny(value, ['mujer', 'femen', 'female', 'woman'])) return 'women';
  if (includesAny(value, ['hombre', 'mascul', 'male', 'man'])) return 'men';
  return 'unknown';
}

async function resolveProfileGender(inventory: Garment[]): Promise<ProfileGender> {
  if (!supabase) return inferGenderFromInventory(inventory);
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const candidates = [
      parseGender(metadata.gender),
      parseGender(metadata.genero),
      parseGender(metadata.profile_gender),
      parseGender(metadata.sex),
    ];
    const fromMetadata = candidates.find((value) => value !== 'unknown') ?? 'unknown';
    return fromMetadata !== 'unknown' ? fromMetadata : inferGenderFromInventory(inventory);
  } catch {
    return inferGenderFromInventory(inventory);
  }
}

function categoryKey(g: Garment): string {
  const sub = normalizeForCompare(g.subcategory ?? '');
  if (sub) return sub;
  return normalizeForCompare(g.category);
}

function toBuckets(inventory: Garment[], flags: WeatherRules): InventoryBucket {
  const buckets: InventoryBucket = {
    top: [],
    bottom: [],
    footwear: [],
    onepiece: [],
    layer: [],
    accessory: [],
  };
  for (const garment of inventory) {
    if (isDisallowedByWeather(garment, flags)) continue;
    if (isFootwear(garment)) buckets.footwear.push(garment);
    if (isOnePiece(garment)) buckets.onepiece.push(garment);
    if (isLayer(garment)) buckets.layer.push(garment);
    if (isTop(garment)) buckets.top.push(garment);
    if (isBottom(garment)) buckets.bottom.push(garment);
    if (isAccessory(garment)) buckets.accessory.push(garment);
  }
  return buckets;
}

function uniqueById(list: Garment[]): Garment[] {
  const seen = new Set<string>();
  const out: Garment[] = [];
  for (const item of list) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function pickFrom(
  list: Garment[],
  selected: Garment[],
  usedAcross: Set<string>,
  options?: { allowReuseAcross?: boolean }
): Garment | null {
  const selectedCategories = new Set(selected.map(categoryKey));
  for (const item of list) {
    if (selected.some((g) => g.id === item.id)) continue;
    if (!options?.allowReuseAcross && usedAcross.has(item.id)) continue;
    if (selectedCategories.has(categoryKey(item))) continue;
    return item;
  }
  for (const item of list) {
    if (selected.some((g) => g.id === item.id)) continue;
    if (!options?.allowReuseAcross && usedAcross.has(item.id)) continue;
    return item;
  }
  return null;
}

function hasDuplicateCategory(outfit: Garment[]): boolean {
  const seen = new Set<string>();
  for (const g of outfit) {
    const key = categoryKey(g);
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

function buildWomenOutfit(
  index: number,
  buckets: InventoryBucket,
  usedAcross: Set<string>,
  flags: WeatherRules
): Garment[] {
  const selected: Garment[] = [];
  const needLayer = index === 2 && !flags.isHot;
  const useOnePiece = index === 1 && buckets.onepiece.length > 0;
  const baseFromOnePiece = index === 2 && buckets.onepiece.length > 0 && buckets.top.length === 0;

  if (useOnePiece || baseFromOnePiece) {
    const onepiece = pickFrom(buckets.onepiece, selected, usedAcross);
    if (onepiece) selected.push(onepiece);
  } else {
    const top = pickFrom(buckets.top, selected, usedAcross);
    if (top) selected.push(top);
    const bottom = pickFrom(buckets.bottom, selected, usedAcross);
    if (bottom) selected.push(bottom);
  }

  const footwear = pickFrom(buckets.footwear, selected, usedAcross);
  if (footwear) selected.push(footwear);

  if (needLayer) {
    const layer = pickFrom(buckets.layer, selected, usedAcross);
    if (layer) selected.push(layer);
  }

  const accessory = pickFrom(buckets.accessory, selected, usedAcross);
  if (accessory) selected.push(accessory);

  return uniqueById(selected);
}

function buildMenOutfit(
  index: number,
  buckets: InventoryBucket,
  usedAcross: Set<string>,
  flags: WeatherRules
): Garment[] {
  const selected: Garment[] = [];
  const top = pickFrom(buckets.top, selected, usedAcross);
  if (top) selected.push(top);
  const bottom = pickFrom(buckets.bottom, selected, usedAcross);
  if (bottom) selected.push(bottom);
  const footwear = pickFrom(buckets.footwear, selected, usedAcross);
  if (footwear) selected.push(footwear);

  if (index >= 1 && !flags.isHot) {
    const layer = pickFrom(buckets.layer, selected, usedAcross);
    if (layer) selected.push(layer);
  }

  const accessory = pickFrom(buckets.accessory, selected, usedAcross);
  if (accessory) selected.push(accessory);

  return uniqueById(selected);
}

function isValidStructure(
  outfit: Garment[],
  gender: ProfileGender,
  optionIndex: number,
  flags: WeatherRules,
  requiresAccessory: boolean
): boolean {
  if (outfit.length < 3) return false;
  if (hasDuplicateCategory(outfit)) return false;

  const slots = {
    top: outfit.some(isTop),
    bottom: outfit.some(isBottom),
    footwear: outfit.some(isFootwear),
    onepiece: outfit.some(isOnePiece),
    layer: outfit.some(isLayer),
    accessory: outfit.some(isAccessory),
  };

  if (!slots.footwear) return false;
  if (requiresAccessory && !slots.accessory) return false;

  if (gender === 'women') {
    if (optionIndex === 1) {
      if (!slots.onepiece) return false;
      if (slots.bottom) return false;
      return true;
    }
    if (optionIndex === 2 && !flags.isHot && !slots.layer) return false;
    if (!slots.onepiece && !(slots.top && slots.bottom)) return false;
    if (slots.onepiece && slots.bottom) return false;
    return true;
  }

  if (!(slots.top && slots.bottom)) return false;
  if (optionIndex >= 1 && !flags.isHot && !slots.layer) return false;
  return true;
}

function reasonFor(gender: ProfileGender, index: number, flags: WeatherRules): string {
  const base = gender === 'women' ? ['Dos piezas equilibradas', 'One-piece pulido', 'Look en capas elevado'] : ['Base esencial pulida', 'Capas con estructura', 'Elevado con personalidad'];
  const climateNote = flags.isHot ? 'adaptado al calor' : flags.isCloudy ? 'ajustado al cielo nublado' : 'equilibrado para hoy';
  return `${base[index]} y ${climateNote}.`;
}

function buildFallbackSuggestions(
  inventory: Garment[],
  gender: ProfileGender,
  flags: WeatherRules
): OutfitSuggestionResponse {
  const buckets = toBuckets(inventory, flags);
  const requiresAccessory = buckets.accessory.length > 0;
  const usedAcross = new Set<string>();
  const suggestions: OutfitSuggestionResponse['suggestions'] = [];

  for (let i = 0; i < MAX_SUGGESTIONS; i++) {
    const outfit =
      gender === 'women'
        ? buildWomenOutfit(i, buckets, usedAcross, flags)
        : buildMenOutfit(i, buckets, usedAcross, flags);

    if (!isValidStructure(outfit, gender, i, flags, requiresAccessory)) {
      const retry =
        gender === 'women'
          ? buildWomenOutfit(i, buckets, new Set<string>(), flags)
          : buildMenOutfit(i, buckets, new Set<string>(), flags);
      if (isValidStructure(retry, gender, i, flags, requiresAccessory)) {
        retry.forEach((g) => usedAcross.add(g.id));
        suggestions.push({ garmentIds: retry.map((g) => g.id), reason: reasonFor(gender, i, flags) });
      }
      continue;
    }

    outfit.forEach((g) => usedAcross.add(g.id));
    suggestions.push({
      garmentIds: outfit.map((g) => g.id),
      reason: reasonFor(gender, i, flags),
    });
  }

  if (suggestions.length === 0) {
    const minimum = uniqueById(inventory.filter((g) => isTop(g) || isBottom(g) || isFootwear(g) || isOnePiece(g) || isAccessory(g))).slice(0, 4);
    suggestions.push({
      garmentIds: minimum.map((g) => g.id),
      reason: 'Combinación base generada con inventario disponible.',
    });
  }

  while (suggestions.length < MAX_SUGGESTIONS) {
    const clone = suggestions[suggestions.length - 1];
    suggestions.push({
      garmentIds: [...clone.garmentIds],
      reason: `${clone.reason} Variación alternativa.`,
    });
  }

  return { suggestions: suggestions.slice(0, MAX_SUGGESTIONS) };
}

/** Solo prendas cuya occasion coincide con la solicitada o es universal ("todo el año"). */
function isGarmentAllowedForOccasion(g: Garment, requestedOccasion: string): boolean {
  const occ = normalizeForCompare(requestedOccasion);
  const gOcc = normalizeForCompare(g.occasion || '');
  const universal = normalizeForCompare('todo el año');
  return gOcc === occ || gOcc === universal;
}

function parseJsonFromContent(raw: string): OutfitSuggestionResponse | null {
  let t = raw.trim();
  const fence = /^```(?:json)?\s*/i;
  if (fence.test(t)) {
    t = t.replace(fence, '').replace(/\s*```\s*$/i, '');
  }
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start !== -1 && end > start) {
    t = t.slice(start, end + 1);
  }
  try {
    const o = JSON.parse(t) as unknown;
    if (!o || typeof o !== 'object') return null;
    const rec = o as { suggestions?: unknown };
    if (!Array.isArray(rec.suggestions)) return null;
    return o as OutfitSuggestionResponse;
  } catch {
    try {
      const fixed = t.replace(/,\s*([}\]])/g, '$1');
      const o = JSON.parse(fixed) as OutfitSuggestionResponse;
      if (!Array.isArray(o.suggestions)) return null;
      return o;
    } catch {
      return null;
    }
  }
}

export async function getOutfitSuggestions(
  inventory: Garment[],
  occasion: string,
  weather?: { temp: number; condition: string }
): Promise<OutfitSuggestionResponse | { error: string }> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    return {
      error:
        'Groq no configurado: falta EXPO_PUBLIC_GROQ_API_KEY. Si usas APK de EAS, reconstruye con eas build --profile preview. Si usas Expo Go, verifica .env y reinicia npm start.',
    };
  }

  if (typeof GROQ_URL !== 'string' || GROQ_URL.length === 0) {
    return { error: 'URL de Groq no configurada.' };
  }

  const allowedInventory = inventory.filter((g) => isGarmentAllowedForOccasion(g, occasion));
  if (allowedInventory.length < 1) {
    return {
      error: `No hay prendas válidas para ocasión "${occasion}". Solo se permiten prendas etiquetadas "${occasion}" o "todo el año".`,
    };
  }

  const flags = weatherFlags(weather);
  const requiresAccessory = allowedInventory.some((g) => isAccessory(g) && !isDisallowedByWeather(g, flags));
  const profileGender = await resolveProfileGender(allowedInventory);

  // CAUSA RAÍZ: el LLM no puede copiar UUIDs largos verbatim → solo sobreviven unas pocas prendas.
  // Solución: mapear a IDs cortos secuenciales (1..N) y remapear la respuesta a los UUID reales.
  const shortIdToReal = new Map<string, string>();
  const inventoryForPrompt = allowedInventory.map((g, idx) => {
    const shortId = String(idx + 1);
    shortIdToReal.set(shortId, g.id);
    return {
      id: shortId,
      name: g.name,
      category: g.category,
      subcategory: g.subcategory ?? null,
      colors: g.colors,
      occasion: g.occasion,
      season: g.season,
    };
  });

  let inventoryJson: string;
  try {
    inventoryJson = JSON.stringify(inventoryForPrompt);
  } catch {
    return { error: 'No se pudo serializar el inventario para el Stylist.' };
  }

  const weatherLine = weather ? `${weather.temp}°C, ${weather.condition}` : 'Desconocido';
  const profileLine =
    profileGender === 'women'
      ? 'women'
      : profileGender === 'men'
        ? 'men'
        : 'unknown';

  const prompt: string = [
    'Eres NAIM International Stylist: asesor de moda profesional con precisión de capas.',
    'Respondes SOLO JSON válido.',
    `Ocasión solicitada: "${occasion}".`,
    `Perfil del usuario (gender): "${profileLine}". Debes revisar este dato antes de sugerir.`,
    `Clima actual: ${weatherLine}.`,
    '',
    'INVENTARIO DISPONIBLE (JSON):',
    inventoryJson,
    '',
    'OBJETIVO:',
    'Genera exactamente 3 outfits distintos y coherentes. Usa EXCLUSIVAMENTE IDs del inventario.',
    '',
    'REGLAS GLOBALES OBLIGATORIAS:',
    '1) No dupliques subcategoría o categoría equivalente dentro del mismo outfit (nunca dos camisas, dos pantalones, etc.).',
    `2) Usa solo prendas con occasion "${occasion}" o "todo el año".`,
    '3) Valida que cada ID seleccionado coincida con su categoría real.',
    '4) Incluye 1 accesorio en cada opción (solo uno por outfit).',
    '5) Si clima nublado: no sugerir lentes.',
    `6) Si calor (${HOT_TEMP_C}°C o más): no sugerir suéter, chamarra, tercera capa ni gorro de invierno.`,
    '7) Gorra/sombrero/boina: preferente para sol; gorra opcional en deportivo.',
    '',
    'ESTRUCTURAS PARA WOMEN (usar cuando gender = women):',
    'Opción 1 (Esencial): 1 Superior Base + 1 Inferior + 1 Calzado + 1 Accesorio.',
    'Opción 2 (One-Piece): 1 Vestido/Jumpsuit/Romper + 1 Calzado + 1 Accesorio. Prohibido agregar pantalón/falda.',
    'Opción 3 (Layering): Estructura A o B + 1 Tercera Capa + 1 Accesorio.',
    '',
    'ESTRUCTURAS PARA MEN (usar cuando gender = men):',
    'Opción 1 (Esencial): 1 Superior Base + 1 Inferior + 1 Calzado + 1 Accesorio.',
    'Opción 2 (Capas): Opción 1 + 1 Tercera Capa.',
    'Opción 3 (Elevado): Opción 2 + 1 Accesorio. Si no hay más accesorios, mantén estructura de capas con enfoque radicalmente distinto.',
    '',
    'SI gender = unknown, infiere por inventario y aplica women si hay falda/vestido; de lo contrario men.',
    '',
    'IMPORTANTE: usa EXACTAMENTE los valores del campo "id" del inventario (números cortos como "1", "2", "3"). NO inventes IDs.',
    '',
    'FORMATO DE RESPUESTA (JSON PURO):',
    '{',
    '  "suggestions": [',
    '    { "garmentIds": ["1", "2", "3"], "reason": "Explicación chic (máx 15 palabras)" },',
    '    { "garmentIds": ["4", "5", "6"], "reason": "Explicación chic (máx 15 palabras)" },',
    '    { "garmentIds": ["7", "8", "9"], "reason": "Explicación chic (máx 15 palabras)" }',
    '  ]',
    '}',
  ].join('\n');

  const GROQ_API_KEY = apiKey;

  const requestPayload = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system' as const,
        content:
          'Eres un asesor de moda internacional experto en estilismo por capas. Cumples reglas estrictas y devuelves solo JSON válido con IDs existentes.',
      },
      { role: 'user' as const, content: prompt },
    ],
    temperature: 0.3,
    seed: Math.floor(Math.random() * 1000000),
    response_format: { type: 'json_object' as const },
    presence_penalty: 1.0,
    frequency_penalty: 1.0,
  };

  let bodyString: string;
  try {
    bodyString = JSON.stringify(requestPayload);
  } catch {
    return { error: 'No se pudo serializar el cuerpo de la petición al Stylist.' };
  }

  if (typeof bodyString !== 'string' || bodyString.length === 0) {
    return { error: 'Cuerpo de petición inválido.' };
  }

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${GROQ_API_KEY}`,
  };

  try {
    console.log('4. Enviando payload a Groq con Seed:', requestPayload.seed);
    console.log('   Inventario corto enviado (id → nombre):', inventoryForPrompt.map((g) => `${g.id}:${g.name}`));

    const response = await fetchGroqWithRetry(GROQ_URL, {
      method: 'POST',
      headers: requestHeaders,
      body: bodyString,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiMsg = (errorData as { error?: { message?: string } })?.error?.message;
      console.warn('[NAIM] Groq stylist falló:', response.status, apiMsg ?? errorData);
      return { error: groqErrorMessage(response.status, apiMsg) };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    console.log('5. Respuesta cruda de la IA (Content):', content);
    if (typeof content !== 'string' || !content.trim()) {
      return { error: 'Respuesta vacía del stylist.' };
    }

    const parsed = parseJsonFromContent(content);
    if (!parsed?.suggestions?.length) {
      return { error: 'No se pudo leer la respuesta del stylist.' };
    }

    // Remapear IDs cortos (1..N) → UUIDs reales. Descarta IDs inventados o fuera de ocasión.
    const realIdToGarment = new Map(allowedInventory.map((g) => [g.id, g]));
    let remapped: OutfitSuggestionResponse = {
      suggestions: parsed.suggestions.map((s) => ({
        garmentIds: (Array.isArray(s.garmentIds) ? s.garmentIds : [])
          .map((sid) => shortIdToReal.get(String(sid)))
          .filter((id): id is string => {
            if (!id) return false;
            const garment = realIdToGarment.get(id);
            return Boolean(
              garment &&
                isGarmentAllowedForOccasion(garment, occasion) &&
                !isDisallowedByWeather(garment, flags)
            );
          }),
        reason: typeof s.reason === 'string' ? s.reason : '',
      })),
    };

    // Validación estructural estricta; si falla, construimos fallback determinístico.
    const validated = remapped.suggestions
      .slice(0, MAX_SUGGESTIONS)
      .map((s, index) => {
        const garments = s.garmentIds.map((id) => realIdToGarment.get(id)).filter(Boolean) as Garment[];
        if (!isValidStructure(garments, profileGender, index, flags, requiresAccessory)) return null;
        return {
          garmentIds: garments.map((g) => g.id),
          reason: s.reason?.trim() || reasonFor(profileGender, index, flags),
        };
      })
      .filter(Boolean) as OutfitSuggestionResponse['suggestions'];

    remapped = { suggestions: validated };
    if (remapped.suggestions.length < MAX_SUGGESTIONS) {
      remapped = buildFallbackSuggestions(allowedInventory, profileGender, flags);
    }

    console.log(
      '6. IDs reales remapeados por outfit:',
      remapped.suggestions.map((s) => s.garmentIds)
    );

    return remapped;
  } catch (error) {
    console.warn('AI Service Error:', error);
    return { error: 'Error de conexión con el Stylist. Verifica tu red o API Key.' };
  }
}
