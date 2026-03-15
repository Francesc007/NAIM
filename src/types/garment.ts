/**
 * Modelo de prenda — diseño inclusivo, categorías no binarias
 */
export interface Garment {
  id: string;
  name: string;
  imagePath: string;
  category: string;
  subcategory?: string;
  colors: string[];
  occasion: string;
  season: string;
  createdAt: string;
  lastWornAt?: string;
  wearCount: number;
}
