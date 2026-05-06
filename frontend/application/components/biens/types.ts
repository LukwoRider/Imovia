export type Property = {
  id: string;
  adresse: string;
  ville: string;
  prix: number;
  surface: number;
  type: string;
  imagesCount: number;
  thumbnail?: string;
  images?: string[];
  is_for_sale: boolean;
  is_under_renovation: boolean;
};

export const ITEMS_PER_PAGE = 4;

export const SURFACE_MIN = 0;
export const SURFACE_MAX = 300;
export const LOYER_MIN = 0;
export const LOYER_MAX = 5000;
