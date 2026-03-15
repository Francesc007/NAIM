import { Garment } from '../types/garment';
import { garmentRepository } from './garmentRepository';

export interface OutfitSuggestion {
  garments: Garment[];
  reason: string;
}

function isTop(category: string): boolean {
  return ['camiseta', 'vestido'].includes(category);
}

function isBottom(category: string): boolean {
  return ['pantalón', 'falda'].includes(category);
}

function isLayer(category: string): boolean {
  return category === 'chaqueta';
}

function pickOne(list: Garment[], used: Set<string>): Garment | null {
  const available = list.filter((g) => !used.has(g.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Motor de sugerencias — combina prendas por categorías
 */
export async function generateSuggestions(
  occasion = 'casual',
  count = 3
): Promise<OutfitSuggestion[]> {
  const all = await garmentRepository.getAll();
  if (all.length < 2) return [];

  const tops = all.filter((g) => isTop(g.category));
  const bottoms = all.filter((g) => isBottom(g.category));
  const layers = all.filter((g) => isLayer(g.category));
  const shoes = all.filter((g) => g.category === 'calzado');
  const accessories = all.filter((g) => g.category === 'accesorio');

  const suggestions: OutfitSuggestion[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count; i++) {
    const top = pickOne(tops, used);
    const bottom = pickOne(bottoms, used);
    if (!top && !bottom) continue;

    const outfit: Garment[] = [];
    if (top) {
      outfit.push(top);
      used.add(top.id);
    }
    if (bottom) {
      outfit.push(bottom);
      used.add(bottom.id);
    }

    const layer = pickOne(layers, used);
    if (layer) {
      outfit.push(layer);
      used.add(layer.id);
    }

    const shoe = pickOne(shoes, used);
    if (shoe) {
      outfit.push(shoe);
      used.add(shoe.id);
    }

    const acc = pickOne(accessories, used);
    if (acc) {
      outfit.push(acc);
      used.add(acc.id);
    }

    if (outfit.length >= 2) {
      const colorList = [...new Set(outfit.flatMap((g) => g.colors))].slice(0, 3).join(', ');
      suggestions.push({
        garments: outfit,
        reason: `Combinación ${occasion} · ${colorList}`,
      });
    }
  }

  return suggestions;
}
