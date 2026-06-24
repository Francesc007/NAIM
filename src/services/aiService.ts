import { Garment } from '../types/garment';
import { getGroqApiKey, GROQ_CHAT_COMPLETIONS_URL } from '../config/groq';
import { fetchGroqWithRetry, groqErrorMessage } from './groqClient';

export interface OutfitSuggestionResponse {
  suggestions: {
    garmentIds: string[];
    reason: string;
  }[];
}

const GROQ_URL = GROQ_CHAT_COMPLETIONS_URL || 'https://api.groq.com/openai/v1/chat/completions';

function normalizeForCompare(s: string): string {
  return (s || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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

  const temp = weather?.temp;
  const coldRule =
    typeof temp === 'number' && temp < 18
      ? `Si la temperatura es MENOR a 18°C (ahora: ${temp}°C), cada outfit DEBE incluir OBLIGATORIAMENTE una prenda cuya categoría sea exactamente "abrigo" o "chamarra" (elige IDs que existan en el inventario). Si no hay ninguna abrigo/chamarra en el inventario, indícalo brevemente en la "reason" de esa opción y usa solo top+bottom+calzado.`
      : 'Temperatura ≥ 18°C o desconocida: no añadas capa de abrigo salvo que encaje con el look.';

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

  const prompt: string = [
    'Eres un STYLIST PROFESIONAL. Tu prioridad absoluta es la coherencia de estilo y el cumplimiento estricto de la ocasión.',
    `Ocasión solicitada: "${occasion}".`,
    `Clima actual: ${weatherLine}.`,
    coldRule,
    '',
    'INVENTARIO PERMITIDO (JSON — cada prenda ya fue filtrada por ocasión):',
    inventoryJson,
    '',
    'REGLAS ESTRICTAS DE OCASIÓN (INCUMPLIR = RESPUESTA INVÁLIDA):',
    `1. SOLO puedes seleccionar prendas cuyo campo "occasion" sea EXACTAMENTE "${occasion}" o EXACTAMENTE "todo el año".`,
    '2. PROHIBIDO mezclar estilos: no uses prendas "deportivo" en looks casual/formal/trabajo, ni formales en casual/deportivo, etc.',
    '3. Antes de proponer CADA outfit, LEE obligatoriamente category, subcategory (si no es null), occasion y season de TODAS las prendas candidatas.',
    '4. Verifica coherencia entre category y subcategory (ej. no combines piezas claramente deportivas con un look formal).',
    '',
    'REGLAS DE COMBINACIÓN:',
    '1. Recorre TODO el JSON hasta el último objeto. No te limites a las primeras prendas.',
    '2. Crea 3 outfits COMPLETAMENTE DIFERENTES entre sí.',
    '3. Prohibido repetir la misma prenda en más de una opción.',
    '4. Cada outfit debe incluir las piezas necesarias (top + bottom o vestido, más calzado si hay en inventario).',
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
          'Eres un experto en moda que SOLO responde en JSON válido. Obedece al 100% las reglas de ocasión y coherencia de estilo del usuario. Nunca mezcles prendas de ocasiones incompatibles.',
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
    const remapped: OutfitSuggestionResponse = {
      suggestions: parsed.suggestions.map((s) => ({
        garmentIds: (Array.isArray(s.garmentIds) ? s.garmentIds : [])
          .map((sid) => shortIdToReal.get(String(sid)))
          .filter((id): id is string => {
            if (!id) return false;
            const garment = realIdToGarment.get(id);
            return Boolean(garment && isGarmentAllowedForOccasion(garment, occasion));
          }),
        reason: s.reason,
      })),
    };
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
