import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, PackageSearch, Loader2, AlertCircle } from 'lucide-react';
import API from '../../api/axios';
import AnnonceCard from '../../components/AnnonceCard/AnnonceCard';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES } from '../../utils/categories';
import type { Annonce } from '../../types';

const Annonces = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorieInitiale = searchParams.get('categorie') || '';
  const { isConnected } = useAuth();

  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [favoris, setFavoris] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlus, setLoadingPlus] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [recherche, setRecherche] = useState('');
  const [ville, setVille] = useState('');
  const [categorie, setCategorie] = useState(categorieInitiale);
  const [showFiltres, setShowFiltres] = useState(false);

  const fetchAnnonces = useCallback((numeroPage: number, reset: boolean) => {
    if (reset) setLoading(true); else setLoadingPlus(true);

    const params: Record<string, string> = { page: String(numeroPage) };
    if (recherche) params.q = recherche;
    if (ville) params.ville = ville;
    if (categorie) params.categorie = categorie;

    API.get('/annonces', { params })
      .then(({ data }) => {
        setAnnonces((prev) => (reset ? data.annonces : [...prev, ...data.annonces]));
        setPages(data.pages);
        setPage(data.page);
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setLoadingPlus(false); });
  }, [recherche, ville, categorie]);

  useEffect(() => {
    fetchAnnonces(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorie, ville]);

  useEffect(() => {
    if (!isConnected) return;
    API.get('/users/favoris')
      .then(({ data }) => setFavoris(data.map((a: Annonce) => a._id)))
      .catch(() => {});
  }, [isConnected]);

  const [erreurFavori, setErreurFavori] = useState('');

  const toggleFavori = useCallback(async (annonceId: string) => {
    setErreurFavori('');
    const etaitFavori = favoris.includes(annonceId);
    setFavoris((prev) => (etaitFavori ? prev.filter((id) => id !== annonceId) : [...prev, annonceId]));
    try {
      const { data } = await API.put(`/users/favoris/${annonceId}`);
      setFavoris(data.favoris);
    } catch {
      setFavoris((prev) => (etaitFavori ? [...prev, annonceId] : prev.filter((id) => id !== annonceId)));
      setErreurFavori("Impossible de mettre à jour vos favoris. Réessayez.");
    }
  }, [favoris]);

  useEffect(() => {
    if (categorie) setSearchParams({ categorie }); else setSearchParams({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorie]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnnonces(1, true);
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Toutes les annonces</h1>
        <p className="text-sm text-slate-500">Trouvez un service ou un produit près de chez vous.</p>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un service, un produit…"
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFiltres(!showFiltres)}
          className={`p-3 rounded-xl border transition ${showFiltres || ville ? 'border-[#007AFF] bg-blue-50 text-[#007AFF]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </form>

      {erreurFavori && (
        <p className="text-xs text-red-500 mb-4 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{erreurFavori}</p>
      )}

      {showFiltres && (
        <div className="glass mb-4 p-4 rounded-xl animate-fade-in">
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Ville</label>
          <input
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            placeholder="Cotonou, Porto-Novo…"
            className="w-full px-4 py-2.5 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
          />
        </div>
      )}

      {/* Filtres catégories */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
        <button
          onClick={() => setCategorie('')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition ${
            categorie === '' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Toutes
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategorie(c.value)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition ${
              categorie === c.value ? 'text-white border-transparent' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            style={categorie === c.value ? { backgroundColor: c.color } : {}}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Résultats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : annonces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <PackageSearch className="w-10 h-10 text-slate-300" />
          <p className="text-slate-500 font-medium">Aucune annonce ne correspond à votre recherche.</p>
          {(recherche || ville || categorie) && (
            <button
              onClick={() => { setRecherche(''); setVille(''); setCategorie(''); }}
              className="text-sm font-semibold text-[#007AFF] hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {annonces.map((a) => (
              <AnnonceCard
                key={a._id}
                annonce={a}
                estFavori={favoris.includes(a._id)}
                onToggleFavori={isConnected ? toggleFavori : undefined}
              />
            ))}
          </div>

          {page < pages && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => fetchAnnonces(page + 1, false)}
                disabled={loadingPlus}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
              >
                {loadingPlus && <Loader2 className="w-4 h-4 animate-spin" />}
                Voir plus d'annonces
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Annonces;
