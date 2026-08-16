import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import API from '../api/axios';
import { useAuth } from './AuthContext';

// ─── Un seul point de vérité pour savoir quels "espaces pro" (boutique,
// restaurant, hôtel, livreur) l'utilisateur connecté a déjà activés.
// Reprend exactement la logique déjà utilisée par MonEspace (mêmes endpoints
// /moi), mais centralisée : la Sidebar et MonEspace consomment désormais la
// même donnée au lieu de refaire chacune leurs 4 appels. Aucune route ni
// logique backend n'est modifiée : on lit juste les mêmes endpoints. ───

export type EspaceId = 'vente' | 'restauration' | 'hotel' | 'livraison';

export const ESPACES_PRO: { id: EspaceId; endpointMoi: string; route: string }[] = [
  { id: 'vente', endpointMoi: '/boutiques/moi', route: '/vente' },
  { id: 'restauration', endpointMoi: '/restaurants/moi', route: '/restauration' },
  { id: 'hotel', endpointMoi: '/hotels/moi', route: '/hotel' },
  { id: 'livraison', endpointMoi: '/livreurs/moi', route: '/livraison' },
];

interface PlatformContextType {
  espacesActifs: Record<EspaceId, boolean>;
  /** Nom public de l'espace quand il existe (nom de la boutique, du restaurant...). */
  nomsEspaces: Partial<Record<EspaceId, string>>;
  chargement: boolean;
  rafraichir: () => void;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

const ETAT_INITIAL: Record<EspaceId, boolean> = {
  vente: false,
  restauration: false,
  hotel: false,
  livraison: false,
};

export const PlatformProvider = ({ children }: { children: ReactNode }) => {
  const { isConnected } = useAuth();
  const [espacesActifs, setEspacesActifs] = useState<Record<EspaceId, boolean>>(ETAT_INITIAL);
  const [nomsEspaces, setNomsEspaces] = useState<Partial<Record<EspaceId, string>>>({});
  const [chargement, setChargement] = useState(true);

  const rafraichir = useCallback(() => {
    if (!isConnected) {
      setEspacesActifs(ETAT_INITIAL);
      setNomsEspaces({});
      setChargement(false);
      return;
    }
    setChargement(true);
    Promise.all(
      ESPACES_PRO.map((espace) =>
        API.get(espace.endpointMoi)
          .then((res) => [espace.id, true, res.data?.nom] as const)
          .catch(() => [espace.id, false, undefined] as const)
      )
    ).then((resultats) => {
      setEspacesActifs(Object.fromEntries(resultats.map(([id, actif]) => [id, actif])) as Record<EspaceId, boolean>);
      setNomsEspaces(Object.fromEntries(resultats.filter(([, , nom]) => nom).map(([id, , nom]) => [id, nom])));
      setChargement(false);
    });
  }, [isConnected]);

  useEffect(() => { rafraichir(); }, [rafraichir]);

  return (
    <PlatformContext.Provider value={{ espacesActifs, nomsEspaces, chargement, rafraichir }}>
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
};
