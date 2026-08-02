import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, UtensilsCrossed, Building2, Bike, ChevronRight, Plus } from 'lucide-react';
import API from '../../api/axios';

interface EspaceInfo {
  id: string;
  nom: string;
  description: string;
  icon: React.ElementType;
  couleur: string;
  route: string;
  endpointMoi: string;
}

const ESPACES: EspaceInfo[] = [
  { id: 'vente', nom: 'Espace Vendeur', description: 'Créez une boutique et vendez vos produits.', icon: Store, couleur: '#007AFF', route: '/vente', endpointMoi: '/boutiques/moi' },
  { id: 'restauration', nom: 'Espace Restauration', description: 'Présentez votre carte et recevez des commandes.', icon: UtensilsCrossed, couleur: '#f59e0b', route: '/restauration', endpointMoi: '/restaurants/moi' },
  { id: 'hotel', nom: 'Espace Hôtel', description: 'Présentez vos chambres et recevez des réservations.', icon: Building2, couleur: '#a855f7', route: '/hotel', endpointMoi: '/hotels/moi' },
  { id: 'livraison', nom: 'Espace Livreur', description: 'Recevez des demandes de livraison près de chez vous.', icon: Bike, couleur: '#22c55e', route: '/livraison', endpointMoi: '/livreurs/moi' },
];

interface Statut {
  actif: boolean;
  chargement: boolean;
}

const MonEspace = () => {
  const [statuts, setStatuts] = useState<Record<string, Statut>>(
    Object.fromEntries(ESPACES.map((e) => [e.id, { actif: false, chargement: true }]))
  );

  useEffect(() => {
    ESPACES.forEach((espace) => {
      API.get(espace.endpointMoi)
        .then(() => setStatuts((prev) => ({ ...prev, [espace.id]: { actif: true, chargement: false } })))
        .catch(() => setStatuts((prev) => ({ ...prev, [espace.id]: { actif: false, chargement: false } })));
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Mon espace</h1>
        <p className="text-sm text-slate-500">
          Activez un ou plusieurs espaces professionnels en plus de votre compte habituel. Vous pouvez continuer à acheter et parcourir les annonces normalement, quel que soit votre choix.
        </p>
      </div>

      <div className="space-y-3">
        {ESPACES.map((espace) => {
          const statut = statuts[espace.id];
          return (
            <Link
              key={espace.id}
              to={espace.route}
              className="glass rounded-2xl p-4 flex items-center gap-4 no-underline hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${espace.couleur}1A`, color: espace.couleur }}
              >
                <espace.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{espace.nom}</p>
                  {!statut.chargement && (
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statut.actif ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {statut.actif ? 'Actif' : 'Non activé'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{espace.description}</p>
              </div>
              {statut.actif ? (
                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              ) : (
                <Plus className="w-4 h-4 text-slate-300 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MonEspace;
