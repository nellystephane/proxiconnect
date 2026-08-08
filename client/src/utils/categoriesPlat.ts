export const CATEGORIES_PLAT = ['Entrées', 'Plats', 'Desserts', 'Boissons'];

export const getCategoriePlatColor = (categorie: string): string => {
  const couleurs: Record<string, string> = {
    'Entrées': '#22c55e',
    'Plats': '#f59e0b',
    'Desserts': '#ec4899',
    'Boissons': '#3b82f6',
  };
  return couleurs[categorie] || '#64748b';
};
