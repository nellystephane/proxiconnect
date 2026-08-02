import { useState, useEffect, useCallback } from 'react';
import { Bike, Search, MapPin, PackageSearch, MessageCircle, Loader2 } from 'lucide-react';
import API from '../../api/axios';
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
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : livreurs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <PackageSearch className="w-10 h-10 text-slate-300" />
          <p className="text-slate-500 font-medium">Aucun livreur en ligne pour le moment.</p>
        </div>
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
                  <button
                    onClick={() => contacter(utilisateur._id, 'livraison', l._id)}
                    disabled={contactEnCours}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#007AFF] border border-[#007AFF] px-3 py-1.5 rounded-full hover:bg-blue-50 transition disabled:opacity-60 flex-shrink-0"
                  >
                    {contactEnCours ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />} Contacter
                  </button>
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
