import { Link } from 'react-router-dom';
import { ArrowRight, Bike, Building2, Plus, Sparkles, Store, UtensilsCrossed } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge, Skeleton } from '../../components/ui';
import { usePlatform } from '../../context/PlatformContext';
import type { EspaceId } from '../../context/PlatformContext';

// ─── Les 4 espaces professionnels : chaque univers garde sa signature
//     chromatique (dégradé de la tuile d'icône + halo d'angle de la carte). ───
interface EspaceInfo {
  id: EspaceId;
  nom: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  halo: string;
  route: string;
}

const ESPACES: EspaceInfo[] = [
  {
    id: 'vente', nom: 'Espace Vendeur', description: 'Créez une boutique et vendez vos produits.',
    icon: Store, gradient: 'linear-gradient(135deg, #007AFF 0%, #5E5CE6 100%)', halo: 'rgba(0,122,255,0.10)', route: '/vente',
  },
  {
    id: 'restauration', nom: 'Espace Restauration', description: 'Présentez votre carte et recevez des commandes.',
    icon: UtensilsCrossed, gradient: 'linear-gradient(135deg, #FF9F0A 0%, #FF6B35 100%)', halo: 'rgba(255,159,10,0.10)', route: '/restauration',
  },
  {
    id: 'hotel', nom: 'Espace Hôtel', description: 'Présentez vos chambres et recevez des réservations.',
    icon: Building2, gradient: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)', halo: 'rgba(168,85,247,0.10)', route: '/hotel',
  },
  {
    id: 'livraison', nom: 'Espace Livreur', description: 'Recevez des demandes de livraison près de chez vous.',
    icon: Bike, gradient: 'linear-gradient(135deg, #30D6C4 0%, #22C55E 100%)', halo: 'rgba(48,214,196,0.12)', route: '/livraison',
  },
];

const MonEspace = () => {
  const { espacesActifs, nomsEspaces, chargement } = usePlatform();
  const nbActifs = ESPACES.filter((e) => espacesActifs[e.id]).length;

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in">
      {/* ─── En-tête ─── */}
      <header className="animate-slide-up mb-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-primary" strokeWidth={2.2} />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-2">Espaces professionnels</span>
            </div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Mon espace</h1>
            <p className="text-sm text-ink-2 mt-1.5 max-w-xl">
              Activez un ou plusieurs espaces professionnels en plus de votre compte habituel. Vous pouvez continuer à acheter et parcourir les annonces normalement, quel que soit votre choix.
            </p>
          </div>

          {!chargement && (
            <div className="glass-pill rounded-full px-4 py-2 flex items-center gap-2.5 flex-shrink-0 self-start sm:self-auto">
              <span className={`w-2 h-2 rounded-full ${nbActifs > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span className="text-xs font-semibold text-ink-2">
                {nbActifs} espace{nbActifs > 1 ? 's' : ''} actif{nbActifs > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ─── Grille des espaces ─── */}
      {chargement ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-56 rounded-3xl" count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ESPACES.map((espace, i) => {
            const actif = espacesActifs[espace.id];
            const nomReel = nomsEspaces[espace.id];
            return (
              <Link
                key={espace.id}
                to={espace.route}
                className="no-underline animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="glass rounded-3xl p-5 h-full relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group">
                  <div
                    className="absolute -top-12 -right-12 w-36 h-36 rounded-full pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${espace.halo}, transparent 70%)` }}
                    aria-hidden="true"
                  />

                  <div className="relative flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: espace.gradient }}>
                        <espace.icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                      </div>
                      <Badge tone={actif ? 'success' : 'neutral'} size="sm" className="uppercase tracking-wide">
                        {actif ? 'Actif' : 'Non activé'}
                      </Badge>
                    </div>

                    <div className="flex-1">
                      <h2 className="text-base font-bold text-ink">{espace.nom}</h2>
                      {actif && nomReel && (
                        <p className="text-xs font-medium text-primary mt-0.5 truncate">{nomReel}</p>
                      )}
                      <p className="text-xs text-ink-3 mt-1.5 leading-relaxed">{espace.description}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200/60">
                      {actif ? (
                        <span className="btn-liquid-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs group-hover:gap-2.5 transition-all">
                          Gérer l'espace <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                        </span>
                      ) : (
                        <span className="btn-liquid-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs">
                          <Plus className="w-3.5 h-3.5" strokeWidth={2.2} /> Activer l'espace
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MonEspace;
