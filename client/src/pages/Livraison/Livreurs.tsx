import { useState, useEffect, useCallback } from 'react';
import { Bike, Search, MapPin, PackageSearch, MessageCircle, Star } from 'lucide-react';
import API from '../../api/axios';
import { Skeleton, EmptyState, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useContacter } from '../../hooks/useContacter';
import type { Livreur } from '../../types';

const Livreurs = () => {
  const { isConnected } = useAuth();
  const { contacter, contactEnCours } = useContacter();
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [loading, setLoading] = useState(true);
  const [ville, setVille] = useState('');

  const fetchLivreurs = useCallback(() => {
    setLoading(true);
    API.get('/livreurs', { params: ville ? { ville } : {} })
      .then(({ data }) => setLivreurs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ville]);

  useEffect(() => { fetchLivreurs(); }, [fetchLivreurs]);

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      {/* ── En-tête annuaire (identité livraison : teal/émeraude) ── */}
      <div className="flex items-center gap-3.5 mb-5 animate-slide-up">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #30D6C4 0%, #22C55E 100%)', boxShadow: '0 10px 30px -8px rgba(48,214,196,0.4)' }}>
          <Bike className="w-5 h-5 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Livreurs disponibles</h1>
          <p className="text-sm text-slate-500">Livreurs actuellement en ligne sur la plateforme.</p>
        </div>
      </div>

      <div className="relative mb-5 animate-slide-up" style={{ animationDelay: '60ms' }}>
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Filtrer par zone / ville" className="glass-pill w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-[108px] rounded-[22px]" count={4} />
        </div>
      ) : livreurs.length === 0 ? (
        <EmptyState icon={PackageSearch} title="Aucun livreur en ligne pour le moment." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {livreurs.map((l) => {
            const utilisateur = typeof l.utilisateur === 'object' ? l.utilisateur : null;
            return (
              <div
                key={l._id}
                className="glass relative rounded-[22px] p-4 flex items-center gap-3.5 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ease-[var(--ease-smooth)]"
              >
                <div className="absolute -top-10 -right-8 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(48,214,196,0.12), transparent 70%)' }} aria-hidden="true" />
                {/* Avatar + pastille de présence en ligne */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(48,214,196,0.16), rgba(34,197,94,0.12))' }}>
                    {utilisateur?.photo ? (
                      <img src={utilisateur.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Bike className="w-5 h-5 text-emerald-500" strokeWidth={2.1} />
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1E2026]" aria-label="En ligne" />
                </div>
                <div className="relative min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : 'Livreur'}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-slate-400 capitalize">{l.moyenTransport}</p>
                    {(l.nombreEvaluations || 0) > 0 && (
                      <span className="flex items-center gap-0.5 text-xs font-medium text-slate-600">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {l.noteMoyenne} <span className="text-slate-400">({l.nombreEvaluations})</span>
                      </span>
                    )}
                  </div>
                  {l.zoneCouverture.length > 0 && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> <span className="truncate">{l.zoneCouverture.join(', ')}</span></p>
                  )}
                </div>
                {isConnected && utilisateur && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => contacter(utilisateur._id, 'livraison', l._id)}
                    loading={contactEnCours}
                    icon={!contactEnCours ? <MessageCircle className="w-3.5 h-3.5" /> : undefined}
                    className="!rounded-full flex-shrink-0 relative"
                  >
                    Contacter
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Livreurs;
