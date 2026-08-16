export const libellePresence = (enLigne?: boolean, dernierActivite?: string | null): string => {
  if (enLigne) return 'En ligne';
  if (!dernierActivite) return '';

  const secondes = Math.floor((Date.now() - new Date(dernierActivite).getTime()) / 1000);
  if (secondes < 60) return 'Vu à l\'instant';
  const minutes = Math.floor(secondes / 60);
  if (minutes < 60) return `Vu il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `Vu il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  if (jours < 7) return `Vu il y a ${jours} j`;
  return 'Vu récemment';
};

/** Petit point de statut (vert = en ligne), à poser en overlay sur un avatar. */
export const PointPresence = ({ enLigne, className = '' }: { enLigne?: boolean; className?: string }) => {
  if (!enLigne) return null;
  return (
    <span
      className={`block w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ${className}`}
      aria-label="En ligne"
    />
  );
};
