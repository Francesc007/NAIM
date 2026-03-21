/**
 * AI Service — Groq (Llama) para sugerencias de outfit
 * Usa fetch nativo (sin groq-sdk) para compatibilidad con React Native.
 * Modelo: llama-3.3-70b-versatile
 */

import { env } from '../utils/env';

const rawKey =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GROQ_API_KEY) ||
  env.GROQ_API_KEY ||
  '';
const API_KEY = rawKey.trim();
const MODEL = 'llama-3.3-70b-versatile';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Prenda con datos para el prompt (categoría, ocasión, estación) */
export interface GarmentForPrompt {
  name: string;
  category: string;
  occasion: string;
  season: string;
}

const OCCASIONS = ['Casual', 'Formal', 'Deportivo', 'Trabajo', 'Ocasión Especial'];

function buildSystemPrompt(weather?: { temp: number; condition: string }): string {
  const weatherLine = weather
    ? `CLIMA: ${weather.temp}°C, ${weather.condition}. Adapta: si hace frío (<15°C) incluye capa (chamarra/suéter); si calor (>28°C) prioriza prendas ligeras, sin capa.`
    : 'No hay datos de clima.';
  return `Eres un experto en moda y stylist profesional. Reglas ESTRICTAS:

1. ${weatherLine}

2. OCASIÓN: Si la ocasión es FORMAL, está PROHIBIDO sugerir jeans, prendas deportivas, camisetas casual o sneakers. Solo prendas elegantes y apropiadas.

3. ESTRUCTURA DEL OUTFIT (4-5 piezas):
   - OBLIGATORIOS: Top (camiseta/blusa), Bottom (pantalón/falda), Calzado
   - OPCIONAL POR CLIMA: Capa (chamarra o suéter) solo si hace frío (<15°C)
   - OPCIONAL POR ESTILO: Accesorio (lentes, gorra o bolsa) para dar personalidad
   NUNCA repitas dos prendas de la misma categoría.

4. COHERENCIA: Las prendas deben combinar en estilo, color y nivel de formalidad según la ocasión.

5. PRIORIZA las prendas que ya están en el clóset del usuario (las que te pasamos). No inventes prendas.

Responde en una sola frase corta y con estilo. Solo texto, sin formato.`;
}

function formatGarment(g: GarmentForPrompt): string {
  const cat = g.category?.trim() || 'Sin categoría';
  const occ = g.occasion?.trim() || 'Sin ocasión';
  const sea = g.season?.trim() || 'Sin estación';
  return `- ${g.name} (Categoría: ${cat}, Ocasión: ${occ}, Estación: ${sea})`;
}

/** Contexto opcional de clima para adaptar sugerencias */
export interface WeatherContext {
  temp: number;
  condition: string;
}

/**
 * Pide una recomendación de outfit.
 * Recibe prendas, ocasión y opcionalmente clima (temp, condition) para adaptar sugerencias.
 */
export async function getOutfitSuggestion(
  garments: GarmentForPrompt[],
  occasion: string,
  weather?: WeatherContext
): Promise<{ text: string } | { error: string }> {
  if (!API_KEY) {
    return { error: 'API key de Groq no configurada. Añade EXPO_PUBLIC_GROQ_API_KEY en .env' };
  }

  const valid = garments.filter(
    (g) => g && typeof g.name === 'string' && g.name.trim().length > 0
  );
  if (valid.length < 1) {
    return { error: 'Necesitas al menos 1 prenda con nombre válido' };
  }

  const occasionLabel = OCCASIONS.find((o) => o.toLowerCase() === occasion.toLowerCase()) || occasion;
  const garmentsList = valid.map(formatGarment).join('\n');

  const userPrompt = `OCASIÓN SOLICITADA: ${occasionLabel}

PRENDAS DISPONIBLES (del clóset del usuario, ya filtradas para esta ocasión):
${garmentsList}

Estas prendas ya fueron seleccionadas para el outfit. Da tu recomendación en una frase corta: por qué combinan bien, el estilo que logran, o un detalle que destaque. Prioriza SIEMPRE prendas que existan en esta lista.`;

  const systemPrompt = buildSystemPrompt(weather);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 120,
        temperature: 0.5,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error?.message ?? data?.message ?? `HTTP ${res.status}`;
      const is429 = res.status === 429 || String(msg).includes('429');
      return {
        error: is429
          ? 'Límite de velocidad. Espera 5 segundos e intenta de nuevo.'
          : `Error: ${msg}`,
      };
    }

    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return { error: 'Respuesta vacía de Groq' };
    return { text };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `Error: ${msg}` };
  }
}
