/**
 * NAIM — Asistente de estilo personal de lujo
 * Consejo de estilo basado en el clima
 */

import { env } from '../utils/env';

const API_KEY = env.GEMINI_API_KEY ?? process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export function getFallbackGreeting(temp: number, condition: string): string {
  return `Hoy ${temp}°C, ${condition}. Un día ideal para elegir tu outfit.`;
}

export async function getMotivationalGreeting(
  temp: number,
  condition: string
): Promise<string | null> {
  if (!API_KEY) return null;
  try {
    const prompt = `Eres NAIM, un asistente de estilo personal de lujo. Basado en el clima actual (Temp: ${temp}°C, Condición: ${condition}), genera un consejo de estilo corto, elegante y motivador para Frank.

REGLAS OBLIGATORIAS:
- Incluye emojis de clima al INICIO y al FINAL del consejo (ej: ☀️ ... ✨).
- No repitas los datos técnicos, enfócate en la sensación y la moda.
- Usa emojis grandes y expresivos.

Responde SOLO con el consejo, sin comillas ni explicaciones.`;
    const res = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 50,
          temperature: 0.7,
        },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || null;
  } catch {
    return null;
  }
}
