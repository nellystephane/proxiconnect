export interface CategorieProduitOption {
  value: string;
  label: string;
  color: string;
}

export const CATEGORIES_PRODUIT: CategorieProduitOption[] = [
  { value: 'Vêtements', label: 'Vêtements', color: '#ec4899' },
  { value: 'Électronique', label: 'Électronique', color: '#3b82f6' },
  { value: 'Alimentation', label: 'Alimentation', color: '#22c55e' },
  { value: 'Beauté & Hygiène', label: 'Beauté & Hygiène', color: '#f43f5e' },
  { value: 'Maison & Décoration', label: 'Maison & Décoration', color: '#f59e0b' },
  { value: 'Chaussures', label: 'Chaussures', color: '#a855f7' },
  { value: 'Accessoires', label: 'Accessoires', color: '#06b6d4' },
  { value: 'Autre', label: 'Autre', color: '#64748b' },
];

export const getCategorieProduitColor = (categorie: string): string => {
  return CATEGORIES_PRODUIT.find((c) => c.value === categorie)?.color || '#64748b';
};
