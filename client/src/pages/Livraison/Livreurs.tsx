import { useState, useEffect, useCallback } from 'react';
import { Bike, Search, MapPin, PackageSearch, MessageCircle } from 'lucide-react';
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
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Livreurs disponibles</h1>
        <p className="text-sm text-slate-500">Livreurs actuellement en ligne sur la plateforme.</p>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Filtrer par zone / ville" className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 shadow-sm" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-20 rounded-2xl" count={4} />
        </div>
      ) : livreurs.length === 0 ? (
        <EmptyState icon={PackageSearch} title="Aucun livreur en ligne pour le moment." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {livreurs.map((l) => {
            const utilisateur = typeof l.utilisateur === 'object' ? l.utilisateur : null;
            return (
              <div key={l._id} className="glass rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Bike className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : 'Livreur'}</p>
                  <p className="text-xs text-slate-400 capitalize">{l.moyenTransport}</p>
                  {l.zoneCouverture.length > 0 && (
                    <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {l.zoneCouverture.join(', ')}</p>
                  )}
                </div>
                {isConnected && utilisateur && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => contacter(utilisateur._id, 'livraison', l._id)}
                    loading={contactEnCours}
                    icon={!contactEnCours ? <MessageCircle className="w-3.5 h-3.5" /> : undefined}
                    className="!rounded-full flex-shrink-0"
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
