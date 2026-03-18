/**
 * Gemini — función simple para sugerencias de outfit
 * Toma 3 nombres de prendas + ocasión, devuelve texto.
 */

import { env } from '../utils/env';

const rawKey = env.GEMINI_API_KEY ?? process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const API_KEY = rawKey.trim();
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent';

/**
 * Pide a Gemini una sugerencia de outfit.
 * Una sola llamada, sin reintentos ni bucles.
 */
export async function getOutfitSuggestion(
  garmentNames: string[],
  occasion: string
): Promise<{ text: string } | { error: string }> {
  if (!API_KEY || garmentNames.length < 1) {
    return { error: !API_KEY ? 'API key no configurada' : 'Necesitas al menos 1 prenda' };
  }

  const names = garmentNames.slice(0, 3).join(', ');
  const prompt = `Eres un stylist. Te daré 3 prendas y una ocasión. Responde en una sola frase corta qué outfit formar y por qué. Solo texto, sin formato complejo.

Prendas: ${names}. Ocasión: ${occasion}.`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 64,
          temperature: 0.6,
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      const errMsg =
        res.status === 429
          ? 'Límite de velocidad. Espera un momento e intenta de nuevo.'
          : `Error ${res.status}: ${errBody?.slice(0, 60) ?? res.statusText}`;
      return { error: errMsg };
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) return { error: 'Respuesta vacía de Gemini' };
    return { text };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `Error de red: ${msg}` };
  }
}
