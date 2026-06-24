const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;

function backoffMs(attempt: number, retryAfterHeader: string | null): number {
  if (retryAfterHeader) {
    const secs = parseInt(retryAfterHeader, 10);
    if (!Number.isNaN(secs) && secs > 0) {
      return Math.min(secs * 1000, 12000);
    }
  }
  return Math.min(1000 * 2 ** attempt + Math.random() * 400, 10000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Petición a Groq con reintentos en errores transitorios (429, 5xx) o fallos de red. */
export async function fetchGroqWithRetry(url: string, init: RequestInit): Promise<Response> {
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || !RETRYABLE_STATUSES.has(response.status) || attempt === MAX_RETRIES) {
        return response;
      }
      lastResponse = response;
      const wait = backoffMs(attempt, response.headers.get('retry-after'));
      console.warn(
        `[NAIM] Groq HTTP ${response.status}, reintento ${attempt + 1}/${MAX_RETRIES} en ${Math.round(wait)}ms`
      );
      await sleep(wait);
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      const wait = backoffMs(attempt, null);
      console.warn(`[NAIM] Groq red fallida, reintento ${attempt + 1}/${MAX_RETRIES}:`, err);
      await sleep(wait);
    }
  }

  return lastResponse!;
}

export function groqErrorMessage(status: number, apiMessage?: string): string {
  if (status === 429) {
    return 'Groq: límite de peticiones alcanzado. Espera unos segundos e inténtalo de nuevo.';
  }
  if (status === 503 || status === 502 || status === 504) {
    return 'Groq: servicio temporalmente no disponible. Inténtalo de nuevo en un momento.';
  }
  if (status >= 500) {
    return 'Groq: error interno del servidor. Inténtalo de nuevo más tarde.';
  }
  return apiMessage ? `Groq: ${apiMessage}` : `Groq: HTTP ${status}`;
}
