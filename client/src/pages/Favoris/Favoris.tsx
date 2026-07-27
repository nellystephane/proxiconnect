import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import API from '../../api/axios';
import AnnonceCard from '../../components/AnnonceCard/AnnonceCard';
import type { Annonce } from '../../types';

const Favoris = () => {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavoris = useCallback(() => {
    setLoading(true);
    API.get('/users/favoris')
      .then(({ data }) => setAnnonces(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchFavoris(); }, [fetchFavoris]);

  const toggleFavori = useCallback(async (annonceId: string) => {
    try {
      await API.put(`/users/favoris/${annonceId}`);
      setAnnonces((prev) => prev.filter((a) => a._id !== annonceId));
    } catch {
      // silencieux
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Mes favoris</h1>
        <p className="text-sm text-slate-500">Les annonces que vous avez enregistrées.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />)}
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
