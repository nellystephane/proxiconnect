import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, SlidersHorizontal, PackageSearch, AlertCircle, ArrowUpDown,
  Zap, Wrench, HardHat, PaintBucket, Hammer, Scissors, Sparkles,
  GraduationCap, Laptop, Sprout, ShoppingBag, KeyRound, Truck, Grip
} from 'lucide-react';
import API from '../../api/axios';
import { Skeleton, EmptyState, Modal, Button, Input, Select } from '../../components/ui';
import AnnonceCard from '../../components/AnnonceCard/AnnonceCard';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES } from '../../utils/categories';
import type { Annonce } from '../../types';

// ─── Icône par catégorie : purement présentationnel, n'affecte pas
// CATEGORIES (qui reste la source de vérité pour le filtrage métier). ───
const ICONES_CATEGORIE: Record<string, typeof Zap> = {
  'Électricité': Zap,
  'Plomberie': Wrench,
  'Maçonnerie': HardHat,
  'Peinture': PaintBucket,
  'Menuiserie': Hammer,
  'Couture': Scissors,
  'Coiffure': Sparkles,
  'Esthétique': Sparkles,
  'Cours particuliers': GraduationCap,
  'Informatique': Laptop,
  'Agriculture': Sprout,
  'Vente de produits': ShoppingBag,
  'Location': KeyRound,
  'Transport': Truck,
  'Autre': Grip,
};

const Annonces = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorieInitiale = searchParams.get('categorie') || '';
  const { isConnected } = useAuth();

  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [total, setTotal] = useState(0);
  const [favoris, setFavoris] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlus, setLoadingPlus] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState(categorieInitiale);

  // Brouillon des filtres avancés : appliqué seulement à la fermeture du panneau,
  // pour ne pas relancer une requête à chaque frappe clavier.
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [ville, setVille] = useState('');
  const [prixMin, setPrixMin] = useState('');
  const [prixMax, setPrixMax] = useState('');
  const [tri, setTri] = useState('recent');
  const [villeDraft, setVilleDraft] = useState('');
  const [prixMinDraft, setPrixMinDraft] = useState('');
  const [prixMaxDraft, setPrixMaxDraft] = useState('');
  const [triDraft, setTriDraft] = useState('recent');

  const nombreFiltresActifs = [ville, prixMin, prixMax, tri !== 'recent' ? tri : ''].filter(Boolean).length;

  const fetchAnnonces = useCallback((numeroPage: number, reset: boolean) => {
    if (reset) setLoading(true); else setLoadingPlus(true);

    const params: Record<string, string> = { page: String(numeroPage) };
    if (recherche) params.q = recherche;
    if (ville) params.ville = ville;
    if (categorie) params.categorie = categorie;
    if (prixMin) params.prixMin = prixMin;
    if (prixMax) params.prixMax = prixMax;
    if (tri !== 'recent') params.tri = tri;

    API.get('/annonces', { params })
      .then(({ data }) => {
        setAnnonces((prev) => (reset ? data.annonces : [...prev, ...data.annonces]));
        setPages(data.pages);
        setPage(data.page);
        setTotal(data.total ?? data.annonces.length);
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setLoadingPlus(false); });
  }, [recherche, ville, categorie, prixMin, prixMax, tri]);

  useEffect(() => {
    fetchAnnonces(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorie, ville, prixMin, prixMax, tri]);

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

  const ouvrirFiltres = () => {
    setVilleDraft(ville);
    setPrixMinDraft(prixMin);
    setPrixMaxDraft(prixMax);
    setTriDraft(tri);
    setFiltresOuverts(true);
  };

  const appliquerFiltres = () => {
    setVille(villeDraft);
    setPrixMin(prixMinDraft);
    setPrixMax(prixMaxDraft);
    setTri(triDraft);
    setFiltresOuverts(false);
  };

  const reinitialiserTout = () => {
    setVilleDraft(''); setPrixMinDraft(''); setPrixMaxDraft(''); setTriDraft('recent');
    setVille(''); setPrixMin(''); setPrixMax(''); setTri('recent');
    setRecherche(''); setCategorie('');
    setFiltresOuverts(false);
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-fade-in">
      {/* ── Zone héro : recherche globale ── */}
      <div className="glass-elevated relative overflow-hidden rounded-[28px] px-5 py-7 sm:px-8 sm:py-9 mb-6">
        <div
          className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(10,132,255,0.35), transparent 70%)' }}
        />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1.5">
            Que cherchez-vous près de chez vous&nbsp;?
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            Services, produits et prestataires de confiance, à portée de main.
          </p>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Un plombier, une coiffeuse, une location…"
                className="w-full pl-11 pr-4 py-3.5 bg-white/90 dark:bg-white/[0.07] border border-transparent rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
              />
            </div>
            <button
              type="button"
              onClick={ouvrirFiltres}
              aria-label="Filtres avancés"
              className={`relative flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                nombreFiltresActifs > 0 ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-white/90 dark:bg-white/[0.07] text-slate-500 dark:text-slate-300 hover:text-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {nombreFiltresActifs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#0B0D12]">
                  {nombreFiltresActifs}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      {erreurFavori && (
        <p className="text-xs text-red-500 mb-4 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{erreurFavori}</p>
      )}

      {/* ── Rail de catégories, avec icônes ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1 snap-x">
        <button
          onClick={() => setCategorie('')}
          className={`shrink-0 snap-start flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
            categorie === ''
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-sm'
              : 'glass-light border-transparent text-slate-600 dark:text-slate-300 hover:-translate-y-0.5'
          }`}
        >
          <Grip className="w-3.5 h-3.5" /> Toutes
        </button>
        {CATEGORIES.map((c) => {
          const Icone = ICONES_CATEGORIE[c.value] || Grip;
          const actif = categorie === c.value;
          return (
            <button
              key={c.value}
              onClick={() => setCategorie(c.value)}
              className={`shrink-0 snap-start flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                actif ? 'text-white border-transparent shadow-sm' : 'glass-light border-transparent text-slate-600 dark:text-slate-300 hover:-translate-y-0.5'
              }`}
              style={actif ? { background: `linear-gradient(135deg, ${c.color}, ${c.color}CC)` } : {}}
            >
              <Icone className="w-3.5 h-3.5" /> {c.label}
            </button>
          );
        })}
      </div>

      {/* ── Résultats ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <Skeleton className="h-72 rounded-[22px]" count={8} />
        </div>
      ) : annonces.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="Aucune annonce ne correspond à votre recherche."
          action={(recherche || ville || categorie || prixMin || prixMax) && (
            <Button variant="outline" size="sm" onClick={reinitialiserTout}>Réinitialiser les filtres</Button>
          )}
        />
      ) : (
        <>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-3">
            {total.toLocaleString('fr-FR')} annonce{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            <div className="flex justify-center mt-8">
              <Button variant="subtle" onClick={() => fetchAnnonces(page + 1, false)} loading={loadingPlus}>
                Voir plus d'annonces
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── Filtres avancés, en feuille modale ── */}
      <Modal open={filtresOuverts} onClose={() => setFiltresOuverts(false)} title="Affiner la recherche" size="sm">
        <div className="space-y-4">
          <Input label="Ville" value={villeDraft} onChange={(e) => setVilleDraft(e.target.value)} placeholder="Cotonou, Porto-Novo…" />

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Budget (XOF)</label>
            <div className="flex items-center gap-2">
              <input type="number" min="0" value={prixMinDraft} onChange={(e) => setPrixMinDraft(e.target.value)} placeholder="Min"
                className="w-full px-4 py-3 bg-slate-100/70 dark:bg-white/[0.06] rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary border border-transparent transition-all" />
              <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
              <input type="number" min="0" value={prixMaxDraft} onChange={(e) => setPrixMaxDraft(e.target.value)} placeholder="Max"
                className="w-full px-4 py-3 bg-slate-100/70 dark:bg-white/[0.06] rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary border border-transparent transition-all" />
            </div>
          </div>

          <Select label="Trier par" value={triDraft} onChange={(e) => setTriDraft(e.target.value)}>
            <option value="recent">Plus récentes</option>
            <option value="prix_asc">Prix croissant</option>
            <option value="prix_desc">Prix décroissant</option>
          </Select>

          <div className="flex items-center gap-2 pt-1">
            <Button variant="outline" fullWidth onClick={reinitialiserTout}>Réinitialiser</Button>
            <Button fullWidth icon={<ArrowUpDown className="w-4 h-4" />} onClick={appliquerFiltres}>Appliquer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Annonces;
