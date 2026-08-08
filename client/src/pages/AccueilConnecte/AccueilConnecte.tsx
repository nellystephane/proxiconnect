import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import AnnonceCard from '../../components/AnnonceCard/AnnonceCard.tsx';
import API from '../../api/axios.ts';
import { Skeleton, EmptyState } from '../../components/ui';
import { Plus, Filter, ChevronDown, Sparkles, LayoutGrid, ArrowRight, X, AlertCircle, Store, UtensilsCrossed, BedDouble, Package } from 'lucide-react';
import type { Annonce, Produit, Plat, Chambre } from '../../types';

const AccueilConnecte = () => {
  const { user } = useAuth();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [favoris, setFavoris] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);

  // Chargement des annonces
  useEffect(() => {
    const fetchAnnonces = async () => {
      try {
        const { data } = await API.get('/annonces?limite=30');
        setAnnonces(data.annonces || []);
      } catch (err) {
        console.error('Erreur chargement annonces', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnonces();
  }, []);

  useEffect(() => {
    API.get('/users/favoris')
      .then(({ data }) => setFavoris(data.map((a: Annonce) => a._id)))
      .catch(() => {});
  }, []);

  // ─── Espaces métiers : produits, plats, chambres visibles par tous les
  // membres connectés (et non plus seulement par le détenteur de l'espace) ───
  const [produits, setProduits] = useState<Produit[]>([]);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [chambres, setChambres] = useState<Chambre[]>([]);

  useEffect(() => {
    API.get('/produits?limite=10').then(({ data }) => setProduits(data.produits || [])).catch(() => {});
    API.get('/plats?limite=10').then(({ data }) => setPlats(data.plats || [])).catch(() => {});
    API.get('/chambres?limite=10').then(({ data }) => setChambres(data.chambres || [])).catch(() => {});
  }, []);

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

  // Extraction des catégories uniques
  const allCategories = useMemo(() => {
    if (!annonces.length) return ['Tout'];
    return ['Tout', ...new Set(annonces.map((a) => a.categorie).filter(Boolean))];
  }, [annonces]);

  // Filtre : max 4 visibles, le reste dans le dropdown
  const visibleCategories = allCategories.slice(0, 4);  const hiddenCategories = allCategories.slice(4);

  // Filtrage frontend (performant pour <100 éléments)
  const filteredAnnonces = useMemo(() => {
    if (activeCategory === 'Tout') return annonces;
    return annonces.filter((a) => a.categorie === activeCategory);
  }, [annonces, activeCategory]);

  return (
    <div className="relative pb-24 space-y-10 animate-fade-in">
      
      {/* ========== HEADER COMPACT ========== */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-[#007AFF] mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Espace membre</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Bonjour, <span className="text-[#007AFF]">{user?.prenom || 'Membre'}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Explorez les annonces récentes dans votre zone.
          </p>
        </div>

        <Link
          to="/deposer"
          className="group inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
          Déposer une annonce
        </Link>
      </header>

      {/* ========== FILTRES CATÉGORIES ========== */}
      <section className="relative animate-slide-up" style={{ animationDelay: '0.1s' } as React.CSSProperties}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {visibleCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-[#007AFF] text-white shadow-md shadow-blue-500/25 scale-105'
                  : 'glass-light text-slate-600 hover:border-blue-400/50 hover:bg-blue-50/50'
              }`}
            >
              {cat}
            </button>          ))}

          {hiddenCategories.length > 0 && (
            <div className="relative shrink-0">
              <button
                onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium border transition-all duration-300 ${
                  showMoreDropdown
                    ? 'border-[#007AFF] text-[#007AFF] bg-blue-50/50'
                    : 'border-slate-200/60 text-slate-500 hover:border-blue-400/50'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Autres
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showMoreDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              <div
                className={`glass-solid absolute top-full left-0 mt-2 w-44 rounded-xl shadow-xl z-50 p-1 transition-all duration-300 origin-top ${
                  showMoreDropdown ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
                }`}
              >
                {hiddenCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setShowMoreDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-blue-50 hover:text-[#007AFF] transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Active filter badge */}
        {activeCategory !== 'Tout' && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-xs font-medium text-[#007AFF] animate-fade-in">
            Filtre actif : {activeCategory}
            <button onClick={() => setActiveCategory('Tout')} className="hover:text-red-500 transition-colors ml-1">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </section>

       {/* ========== ESPACES MÉTIERS : produits, plats, chambres ========== */}
      {produits.length > 0 && (
        <section className="animate-slide-up" style={{ animationDelay: '0.15s' } as React.CSSProperties}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Store className="w-4 h-4 text-[#007AFF]" /> Produits en vedette</h2>
            <Link to="/boutiques" className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1">Voir tout <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {produits.map((p) => {
              const boutique = typeof p.boutique === 'object' ? p.boutique : null;
              return (
                <Link key={p._id} to={boutique ? `/boutique/${boutique._id}` : '/boutiques'} className="shrink-0 w-36 glass-light rounded-2xl overflow-hidden no-underline hover:shadow-md transition-shadow">
                  <div className="h-24 bg-slate-100 flex items-center justify-center overflow-hidden">
                    {p.photos?.[0] ? <img src={p.photos[0]} alt={p.nom} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-slate-300" />}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-slate-900 truncate">{p.nom}</p>
                    <p className="text-xs font-bold text-[#007AFF]">{p.prix.toLocaleString('fr-FR')} XOF</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {plats.length > 0 && (
        <section className="animate-slide-up" style={{ animationDelay: '0.18s' } as React.CSSProperties}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800"><UtensilsCrossed className="w-4 h-4 text-amber-500" /> Plats disponibles</h2>
            <Link to="/restaurants" className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1">Voir tout <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {plats.map((p) => {
              const restaurant = typeof p.restaurant === 'object' ? p.restaurant : null;
              return (
                <Link key={p._id} to={restaurant ? `/restaurant/${restaurant._id}` : '/restaurants'} className="shrink-0 w-36 glass-light rounded-2xl overflow-hidden no-underline hover:shadow-md transition-shadow">
                  <div className="h-24 bg-slate-100 flex items-center justify-center overflow-hidden">
                    {p.photos?.[0] ? <img src={p.photos[0]} alt={p.nom} className="w-full h-full object-cover" /> : <UtensilsCrossed className="w-5 h-5 text-slate-300" />}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-slate-900 truncate">{p.nom}</p>
                    <p className="text-xs font-bold text-[#007AFF]">{p.prix.toLocaleString('fr-FR')} XOF</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {chambres.length > 0 && (
        <section className="animate-slide-up" style={{ animationDelay: '0.21s' } as React.CSSProperties}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800"><BedDouble className="w-4 h-4 text-purple-500" /> Chambres disponibles</h2>
            <Link to="/hotels" className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1">Voir tout <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {chambres.map((c) => {
              const hotel = typeof c.hotel === 'object' ? c.hotel : null;
              return (
                <Link key={c._id} to={hotel ? `/hotel/${hotel._id}` : '/hotels'} className="shrink-0 w-36 glass-light rounded-2xl overflow-hidden no-underline hover:shadow-md transition-shadow">
                  <div className="h-24 bg-slate-100 flex items-center justify-center overflow-hidden">
                    {c.photos?.[0] ? <img src={c.photos[0]} alt={c.type} className="w-full h-full object-cover" /> : <BedDouble className="w-5 h-5 text-slate-300" />}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-slate-900 truncate">{c.type}</p>
                    <p className="text-xs font-bold text-[#007AFF]">{c.prixParNuit.toLocaleString('fr-FR')} XOF/nuit</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

       {/* ========== GRILLE / LOADING / EMPTY ========== */}      
        {erreurFavori && (
          <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{erreurFavori}</p>
        )}
        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-40 rounded-2xl" count={4} />
          </div>
        ) : filteredAnnonces.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title="Aucune annonce dans cette catégorie."
            action={
              <button
                onClick={() => setActiveCategory('Tout')}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#007AFF] hover:underline transition-colors"
              >
                Voir toutes les annonces <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {filteredAnnonces.map((annonce) => (
              <AnnonceCard key={annonce._id} annonce={annonce} estFavori={favoris.includes(annonce._id)} onToggleFavori={toggleFavori} />
            ))}
            <Link
              to="/annonces"
              className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[#007AFF] hover:underline py-2"
            >
              Voir toutes les annonces <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

      {/* Ferme le dropdown si on clique ailleurs */}
      {showMoreDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMoreDropdown(false)}
        />
      )}
    </div>
  );
};

export default AccueilConnecte;