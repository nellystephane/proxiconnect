import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, AlertCircle, RotateCcw, Search, X } from 'lucide-react';
import API from '../../api/axios';
import { Skeleton, EmptyState, Input } from '../../components/ui';
import AnnonceCard from '../../components/AnnonceCard/AnnonceCard';
import type { Annonce } from '../../types';

const Favoris = () => {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(false);
  const [erreurAction, setErreurAction] = useState('');

  // ─── Recherche + filtre catégorie : purement côté client, sur les favoris
  // déjà chargés (aucun nouvel endpoint). ───
  const [recherche, setRecherche] = useState('');
  const [categorieActive, setCategorieActive] = useState('Tout');

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

  const categories = useMemo(
    () => ['Tout', ...Array.from(new Set(annonces.map((a) => a.categorie).filter(Boolean)))],
    [annonces]
  );

  const annoncesFiltrees = useMemo(() => {
    return annonces.filter((a) => {
      const matchCategorie = categorieActive === 'Tout' || a.categorie === categorieActive;
      const matchRecherche = !recherche.trim() || a.titre.toLowerCase().includes(recherche.trim().toLowerCase());
      return matchCategorie && matchRecherche;
    });
  }, [annonces, categorieActive, recherche]);

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Mes favoris</h1>
        <p className="text-sm text-slate-500">Les annonces que vous avez enregistrées.</p>
      </div>

      {!loading && !erreur && annonces.length > 0 && (
        <div className="mb-5 space-y-3">
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher dans mes favoris..."
            icon={<Search className="w-4 h-4" />}
          />
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategorieActive(cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  categorieActive === cat
                    ? 'bg-primary text-white shadow-sm shadow-primary/25'
                    : 'glass-light text-slate-600 hover:bg-primary/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {erreurAction && (
        <p className="text-xs text-red-500 mb-4 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{erreurAction}</p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-2xl" count={4} />
        </div>
      ) : erreur ? (
        <EmptyState
          icon={AlertCircle}
          title="Impossible de charger vos favoris pour le moment."
          action={
            <button onClick={fetchFavoris} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Réessayer
            </button>
          }
        />
      ) : annonces.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Vous n'avez aucune annonce favorite pour le moment."
          action={
            <Link to="/annonces" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              Parcourir les annonces <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
      ) : annoncesFiltrees.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Aucun favori ne correspond à ce filtre."
          action={
            <button
              onClick={() => { setRecherche(''); setCategorieActive('Tout'); }}
              className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Réinitialiser les filtres
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {annoncesFiltrees.map((a) => (
            <AnnonceCard key={a._id} annonce={a} estFavori onToggleFavori={toggleFavori} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favoris;
