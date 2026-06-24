/**
 * Configuración única de Groq — misma clave EXPO_PUBLIC_GROQ_API_KEY (app.config extra + .env).
 * Modelos según https://console.groq.com/docs/models y /docs/vision
 */
import { env } from '../utils/env';

export const GROQ_CHAT_COMPLETIONS_URL =
  'https://api.groq.com/openai/v1/chat/completions';

/** Texto: sugerencias de outfit (producción) */
export const GROQ_TEXT_MODEL = 'llama-3.3-70b-versatile';

/**
 * Visión: clasificación de prendas desde imagen (multimodal oficial Groq).
 */
export const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

export function getGroqApiKey(): string {
  return env.GROQ_API_KEY ?? '';
}
