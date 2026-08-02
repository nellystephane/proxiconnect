import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, AlertCircle, RotateCcw } from 'lucide-react';
import API from '../../api/axios';
import AnnonceCard from '../../components/AnnonceCard/AnnonceCard';
import type { Annonce } from '../../types';

const Favoris = () => {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(false);
  const [erreurAction, setErreurAction] = useState('');

  const fetchFavoris = useCallback(() => {
    setLoading(true);
    setErreur(false);
    API.get('/users/favoris')
      .then(({ data }) => {
        // Une annonce favorite peut avoir été supprimée entre-temps : le
        // populate() renvoie alors null pour cette entrée, ce qui ferait
        // planter le rendu si on ne filtrait pas ces références orphelines.
        setAnnonces((data as (Annonce | null)[]).filter((a): a is Annonce => !!a));
      })
      .catch(() => setErreur(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchFavoris(); }, [fetchFavoris]);

  const toggleFavori = useCallback(async (annonceId: string) => {
    setErreurAction('');
    const precedent = annonces;
    // Retrait optimiste : la carte disparaît immédiatement de la liste.
    setAnnonces((prev) => prev.filter((a) => a._id !== annonceId));
    try {
      await API.put(`/users/favoris/${annonceId}`);
    } catch {
      // Échec : on restaure la liste précédente et on prévient l'utilisateur
      // au lieu de laisser l'annonce disparaître sans explication.
      setAnnonces(precedent);
      setErreurAction("Impossible de retirer cette annonce des favoris. Réessayez.");
    }
  }, [annonces]);

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Mes favoris</h1>
        <p className="text-sm text-slate-500">Les annonces que vous avez enregistrées.</p>
      </div>

      {erreurAction && (
        <p className="text-xs text-red-500 mb-4 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{erreurAction}</p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : erreur ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <AlertCircle className="w-10 h-10 text-slate-300" />
          <p className="text-slate-500 font-medium">Impossible de charger vos favoris pour le moment.</p>
          <button
            onClick={fetchFavoris}
            className="text-sm font-semibold text-[#007AFF] hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Réessayer
          </button>
        </div>
      ) : annonces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <Heart className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">Vous n'avez aucune annonce favorite pour le moment.</p>
          <Link to="/annonces" className="text-sm font-semibold text-[#007AFF] hover:underline flex items-center gap-1">
            Parcourir les annonces <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {annonces.map((a) => (
            <AnnonceCard key={a._id} annonce={a} estFavori onToggleFavori={toggleFavori} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favoris;
