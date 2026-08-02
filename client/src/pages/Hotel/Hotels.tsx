import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Search, MapPin, PackageSearch, Loader2 } from 'lucide-react';
import API from '../../api/axios';
import type { Hotel } from '../../types';

const Hotels = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlus, setLoadingPlus] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [ville, setVille] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchHotels = useCallback((numeroPage: number, reset: boolean) => {
    if (reset) setLoading(true); else setLoadingPlus(true);
    const params: Record<string, string> = { page: String(numeroPage) };
    if (recherche) params.recherche = recherche;
    if (ville) params.ville = ville;

    API.get('/hotels', { params })
      .then(({ data }) => {
        setHotels((prev) => (reset ? data.hotels : [...prev, ...data.hotels]));
        setPages(data.pages);
        setPage(data.page);
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setLoadingPlus(false); });
  }, [recherche, ville]);

  useEffect(() => { fetchHotels(1, true); }, [fetchHotels]);

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Hôtels &amp; hébergements</h1>
        <p className="text-sm text-slate-500">Trouvez où séjourner près de chez vous.</p>
      </div>

      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un établissement" className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 shadow-sm" />
        </div>
        <div className="relative w-32">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Ville" className="w-full pl-9 pr-2 py-2.5 bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 shadow-sm" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : hotels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <PackageSearch className="w-10 h-10 text-slate-300" />
          <p className="text-slate-500 font-medium">Aucun établissement trouvé.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hotels.map((h) => (
              <Link key={h._id} to={`/hotel/${h._id}`} className="glass rounded-2xl p-4 flex items-center gap-3 no-underline hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {h.logo ? <img src={h.logo} alt={h.nom} className="w-full h-full object-cover" /> : <Building2 className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{h.nom}</p>
                  {h.localisation?.ville && <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {h.localisation.ville}</p>}
                </div>
              </Link>
            ))}
          </div>

          {page < pages && (
            <div className="flex justify-center mt-6">
              <button onClick={() => fetchHotels(page + 1, false)} disabled={loadingPlus} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white shadow-sm text-sm font-semibold text-slate-600 hover:text-[#007AFF] transition">
                {loadingPlus && <Loader2 className="w-4 h-4 animate-spin" />} Voir plus
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Hotels;
