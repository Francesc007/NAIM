/**
 * NAIM — Mensajes de clima por estado (sin IA externa)
 * No repite icono ni temperatura; frases variadas y amables.
 */

/** Mapeo icon OpenWeather → estado simplificado */
export function getWeatherState(icon: string | null): string {
  if (!icon) return 'default';
  const code = icon.slice(0, 2);
  if (code === '01') return 'sunny';
  if (code === '02' || code === '03' || code === '04') return 'cloudy';
  if (code === '09' || code === '10') return 'rainy';
  if (code === '11') return 'stormy';
  if (code === '13') return 'snowy';
  if (code === '50') return 'foggy';
  return 'default';
}

/** Mensajes por estado — no repiten temp ni icono */
const WEATHER_MESSAGES: Record<string, string[]> = {
  sunny: [
    'El sol está a tu favor, saca los lentes.',
    'Día perfecto para lucir ligero.',
    'Brilla como el día.',
  ],
  cloudy: [
    'Cielo gris, estilo nítido.',
    'Día de capas sutiles.',
    'El clima pide versatilidad.',
  ],
  rainy: [
    'Día de capas y paraguas, elige algo resistente.',
    'Lluvia afuera, estilo impecable adentro.',
    'Protección con estilo.',
  ],
  stormy: [
    'Tiempo de quedarse elegante en casa.',
    'El clima pide prendas que te abriguen.',
  ],
  snowy: [
    'Momento de sacar esa chamarra favorita.',
    'Frío afuera, calidez en tu look.',
  ],
  foggy: [
    'Niebla de mañana, capas de estilo.',
    'Día suave para looks neutros.',
  ],
  default: [
    'Hoy es un buen día para lucir bien.',
    'Tu outfit, tu decisión.',
  ],
};

/** Mensajes extra para frío (< 15°C) */
const COLD_MESSAGES = [
  'Momento de sacar esa chamarra favorita.',
  'Abrígate con estilo.',
  'Capas que suman.',
];

/** Mensajes extra para calor (> 28°C) */
const HOT_MESSAGES = [
  'El sol está a tu favor, saca los lentes.',
  'Día para ir ligero.',
  'Menos es más hoy.',
];

export function getWeatherMessage(
  temp: number,
  icon: string | null,
  state?: string
): string {
  const s = state ?? getWeatherState(icon);
  const options = WEATHER_MESSAGES[s] ?? WEATHER_MESSAGES.default;

  if (temp < 15) {
    const cold = COLD_MESSAGES[Math.floor(Math.random() * COLD_MESSAGES.length)];
    return cold;
  }
  if (temp > 28) {
    const hot = HOT_MESSAGES[Math.floor(Math.random() * HOT_MESSAGES.length)];
    return hot;
  }

  return options[Math.floor(Math.random() * options.length)];
}

/** Fallback sin clima (para compatibilidad) */
export function getFallbackGreeting(temp: number, condition: string): string {
  return getWeatherMessage(temp, null, 'default');
}
