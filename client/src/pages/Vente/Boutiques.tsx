import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Store, Search, MapPin, PackageSearch } from 'lucide-react';
import API from '../../api/axios';
import { Skeleton, EmptyState, Button } from '../../components/ui';
import type { Boutique } from '../../types';

const Boutiques = () => {
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlus, setLoadingPlus] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [ville, setVille] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchBoutiques = useCallback((numeroPage: number, reset: boolean) => {
    if (reset) setLoading(true); else setLoadingPlus(true);
    const params: Record<string, string> = { page: String(numeroPage) };
    if (recherche) params.recherche = recherche;
    if (ville) params.ville = ville;

    API.get('/boutiques', { params })
      .then(({ data }) => {
        setBoutiques((prev) => (reset ? data.boutiques : [...prev, ...data.boutiques]));
        setPages(data.pages);
        setPage(data.page);
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setLoadingPlus(false); });
  }, [recherche, ville]);

  useEffect(() => { fetchBoutiques(1, true); }, [fetchBoutiques]);

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Boutiques près de chez vous</h1>
        <p className="text-sm text-slate-500">Découvrez les vendeurs de la plateforme.</p>
      </div>

      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une boutique"
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          />
        </div>
        <div className="relative w-32">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            placeholder="Ville"
            className="w-full pl-9 pr-2 py-2.5 bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-2xl" count={4} />
        </div>
      ) : boutiques.length === 0 ? (
        <EmptyState icon={PackageSearch} title="Aucune boutique trouvée." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {boutiques.map((b) => (
              <Link
                key={b._id}
                to={`/boutique/${b._id}`}
                className="glass rounded-2xl p-4 flex items-center gap-3 no-underline hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {b.logo ? <img src={b.logo} alt={b.nom} className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{b.nom}</p>
                  {b.localisation?.ville && (
                    <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.localisation.ville}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {page < pages && (
            <div className="flex justify-center mt-6">
              <Button variant="subtle" size="sm" onClick={() => fetchBoutiques(page + 1, false)} loading={loadingPlus}>
                Voir plus
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Boutiques;
