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
      {/* ── En-tête annuaire ── */}
      <div className="flex items-center gap-3.5 mb-5 animate-slide-up">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow-primary)' }}>
          <Store className="w-5 h-5 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Boutiques près de chez vous</h1>
          <p className="text-sm text-slate-500">Découvrez les vendeurs de la plateforme.</p>
        </div>
      </div>

      {/* ── Recherche en pilules verre ── */}
      <div className="flex gap-2 mb-5 animate-slide-up" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une boutique"
            className="glass-pill w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/25 transition-all"
          />
        </div>
        <div className="relative w-32">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            placeholder="Ville"
            className="glass-pill w-full pl-9 pr-2 py-2.5 rounded-2xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/25 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-[104px] rounded-[22px]" count={4} />
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
                className="glass group relative rounded-[22px] p-4 flex items-center gap-3.5 no-underline overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-[var(--ease-smooth)] active:scale-[0.98]"
              >
                <div className="absolute -top-10 -right-8 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(10,132,255,0.10), transparent 70%)' }} aria-hidden="true" />
                <div
                  className="relative w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.12), rgba(94,92,230,0.12))', boxShadow: 'var(--glass-specular)' }}
                >
                  {b.logo ? <img src={b.logo} alt={b.nom} className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-primary" strokeWidth={2.1} />}
                </div>
                <div className="relative min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{b.nom}</p>
                  {b.localisation?.ville && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {b.localisation.ville}</p>
                  )}
                </div>
                <span className="glass-pill relative rounded-full px-2.5 py-1.5 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  Visiter →
                </span>
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
