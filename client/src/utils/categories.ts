export interface CategoryOption {
  value: string;
  label: string;
  color: string;
}

export const CATEGORIES: CategoryOption[] = [
  { value: 'Électricité', label: 'Électricité', color: '#f59e0b' },
  { value: 'Plomberie', label: 'Plomberie', color: '#3b82f6' },
  { value: 'Maçonnerie', label: 'Maçonnerie', color: '#f97316' },
  { value: 'Peinture', label: 'Peinture', color: '#a855f7' },
  { value: 'Menuiserie', label: 'Menuiserie', color: '#d97706' },
  { value: 'Couture', label: 'Couture', color: '#ec4899' },
  { value: 'Coiffure', label: 'Coiffure', color: '#8b5cf6' },
  { value: 'Esthétique', label: 'Esthétique', color: '#f43f5e' },
  { value: 'Cours particuliers', label: 'Cours particuliers', color: '#10b981' },
  { value: 'Informatique', label: 'Informatique', color: '#06b6d4' },
  { value: 'Agriculture', label: 'Agriculture', color: '#22c55e' },
  { value: 'Vente de produits', label: 'Vente de produits', color: '#ef4444' },
  { value: 'Location', label: 'Location', color: '#6366f1' },
  { value: 'Transport', label: 'Transport', color: '#3b82f6' },
  { value: 'Autre', label: 'Autre', color: '#64748b' },
];

export const getCategorieColor = (categorie: string): string => {
  return CATEGORIES.find((c) => c.value === categorie)?.color || '#64748b';
};
