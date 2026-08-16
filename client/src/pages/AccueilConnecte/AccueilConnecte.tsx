import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import AnnonceCard from '../../components/AnnonceCard/AnnonceCard.tsx';
import API from '../../api/axios.ts';
import { Skeleton, EmptyState } from '../../components/ui';
import {
  AlertCircle, ArrowRight, BedDouble, Bike, Building2, ChevronDown, Filter,
  Flame, LayoutGrid, Package, Plus, Search, Sparkles, Store, Users, UtensilsCrossed, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Annonce, Produit, Plat, Chambre } from '../../types';

// ─── Les quatre "univers" ProxiConnect : chaque monde possède sa signature
//     chromatique (dégradé + halo) réutilisée sur ses cartes d'accès rapide
//     et ses sections de découverte. ───
interface Univers {
  label: string;
  sousTitre: string;
  icon: LucideIcon;
  to: string;
  gradient: string;
  halo: string;
}

const UNIVERS: Univers[] = [
  { label: 'Boutiques', sousTitre: 'Produits locaux', icon: Store, to: '/boutiques', gradient: 'linear-gradient(135deg, #007AFF 0%, #5E5CE6 100%)', halo: 'rgba(0,122,255,0.12)' },
  { label: 'Restaurants', sousTitre: 'Plats & commandes', icon: UtensilsCrossed, to: '/restaurants', gradient: 'linear-gradient(135deg, #FF9F0A 0%, #FF6B35 100%)', halo: 'rgba(255,159,10,0.12)' },
  { label: 'Hôtels', sousTitre: 'Chambres & séjours', icon: Building2, to: '/hotels', gradient: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)', halo: 'rgba(168,85,247,0.12)' },
  { label: 'Livreurs', sousTitre: 'Livraison rapide', icon: Bike, to: '/livreurs', gradient: 'linear-gradient(135deg, #30D6C4 0%, #22C55E 100%)', halo: 'rgba(48,214,196,0.14)' },
];

const TITRE_SECTION = 'flex items-center gap-2 text-sm font-bold text-ink';
const LIEN_VOIR_TOUT = 'text-xs font-semibold text-primary hover:underline flex items-center gap-1 flex-shrink-0';

// En-tête de section univers : pastille dégradée + titre + lien "Voir tout".
const EnteteSection = ({ gradient, icon: Icone, titre, lien, lienLabel }: {
  gradient: string; icon: LucideIcon; titre: string; lien: string; lienLabel: string;
}) => (
  <div className="flex items-center justify-between">
    <h2 className={TITRE_SECTION}>
      <span className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: gradient }}>
        <Icone className="w-4 h-4 text-white" strokeWidth={2.2} />
      </span>
      {titre}
    </h2>
    <Link to={lien} className={LIEN_VOIR_TOUT}>
      {lienLabel} <ArrowRight className="w-3 h-3" strokeWidth={2.2} />
    </Link>
  </div>
);

const AccueilConnecte = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState('');
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
  //     membres connectés (et non plus seulement par le détenteur de l'espace) ───
  const [produits, setProduits] = useState<Produit[]>([]);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [chargementUnivers, setChargementUnivers] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/produits?limite=10').then(({ data }) => setProduits(data.produits || [])).catch(() => {}),
      API.get('/plats?limite=10').then(({ data }) => setPlats(data.plats || [])).catch(() => {}),
      API.get('/chambres?limite=10').then(({ data }) => setChambres(data.chambres || [])).catch(() => {}),
    ]).finally(() => setChargementUnivers(false));
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

  // Recherche globale : redirige vers la liste des annonces filtrée
  const soumettreRecherche = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = recherche.trim();
    navigate(q ? `/annonces?q=${encodeURIComponent(q)}` : '/annonces');
  };

  // Extraction des catégories uniques
  const allCategories = useMemo(() => {
    if (!annonces.length) return ['Tout'];
    return ['Tout', ...new Set(annonces.map((a) => a.categorie).filter(Boolean))];
  }, [annonces]);

  // Filtre : max 4 visibles, le reste dans le dropdown
  const visibleCategories = allCategories.slice(0, 4);
  const hiddenCategories = allCategories.slice(4);

  // Filtrage frontend (performant pour <100 éléments)
  const filteredAnnonces = useMemo(() => {
    if (activeCategory === 'Tout') return annonces;
    return annonces.filter((a) => a.categorie === activeCategory);
  }, [annonces, activeCategory]);

  return (
    <div className="relative pb-8 space-y-8 animate-fade-in">

      {/* ========== HERO DÉCOUVERTE : salutation + recherche + univers ========== */}
      <section className="glass-elevated rounded-3xl p-5 sm:p-7 relative overflow-hidden animate-slide-up">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(10,132,255,0.14), transparent 70%)' }} aria-hidden="true" />
        <div className="absolute -bottom-28 -left-20 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(48,214,196,0.12), transparent 70%)' }} aria-hidden="true" />

        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" strokeWidth={2.2} /> Explorer
              </div>
              <h1 className="text-2xl sm:text-[28px] font-bold text-ink tracking-tight">
                Bonjour, <span className="text-primary">{user?.prenom || 'Membre'}</span>
              </h1>
              <p className="text-sm text-ink-2 mt-1.5">
                Explorez les annonces récentes dans votre zone.
              </p>
            </div>

            <Link
              to="/deposer"
              className="btn-liquid-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm no-underline flex-shrink-0"
            >
              <Plus className="w-4 h-4" strokeWidth={2.2} />
              Déposer une annonce
            </Link>
          </div>

          <form onSubmit={soumettreRecherche} className="mt-5 flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-ink-3 pointer-events-none" strokeWidth={2.2} />
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un service, un produit, une boutique…"
                aria-label="Recherche globale"
                className="w-full glass rounded-full pl-11 pr-4 py-3 text-sm text-ink placeholder:text-ink-3 outline-none transition-all duration-200"
              />
            </div>
            <button
              type="submit"
              className="btn-liquid-primary rounded-full px-5 py-3 text-sm flex-shrink-0"
            >
              Rechercher
            </button>
          </form>

          {/* Accès directs aux univers : pilules défilables sur mobile */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-0.5">
            {UNIVERS.map((u) => (
              <Link
                key={u.to}
                to={u.to}
                className="glass-pill shrink-0 inline-flex items-center gap-2 rounded-full pl-1.5 pr-3.5 py-1.5 no-underline hover:-translate-y-0.5 transition-transform duration-200"
              >
                <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: u.gradient }}>
                  <u.icon className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
                </span>
                <span className="text-xs font-semibold text-ink whitespace-nowrap">{u.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FILTRES CATÉGORIES ========== */}
      <section className="animate-slide-up" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {visibleCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat
                  ? 'btn-liquid-primary'
                  : 'glass-pill text-ink-2 hover:text-ink'
              }`}
            >
              {cat}
            </button>
          ))}

          {hiddenCategories.length > 0 && (
            <div className="relative shrink-0">
              <button
                onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  showMoreDropdown ? 'glass-pill text-primary' : 'glass-pill text-ink-2 hover:text-ink'
                }`}
              >
                <Filter className="w-3.5 h-3.5" strokeWidth={2.2} />
                Autres
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showMoreDropdown ? 'rotate-180' : ''}`} strokeWidth={2.2} />
              </button>

              {/* Dropdown */}
              <div
                className={`glass-solid absolute top-full left-0 mt-2 w-44 rounded-2xl shadow-xl z-50 p-1.5 transition-all duration-300 origin-top ${
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
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors hover:bg-blue-500/10 ${
                      activeCategory === cat ? 'text-primary font-semibold' : 'text-ink-2 hover:text-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filtre actif */}
        {activeCategory !== 'Tout' && (
          <div className="mt-3 inline-flex items-center gap-2 glass-pill px-3 py-1.5 rounded-full text-xs font-medium text-primary animate-fade-in">
            Filtre actif : {activeCategory}
            <button onClick={() => setActiveCategory('Tout')} className="hover:text-red-500 transition-colors ml-1" aria-label="Retirer le filtre">
              <X className="w-3 h-3" strokeWidth={2.2} />
            </button>
          </div>
        )}
      </section>

      {/* ========== ANNONCES RÉCENTES : carrousel snap mobile / grille desktop ========== */}
      <section className="animate-slide-up space-y-3" style={{ animationDelay: '120ms' }}>
        <div className="flex items-center justify-between">
          <h2 className={TITRE_SECTION}>
            <span className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--gradient-primary)' }}>
              <LayoutGrid className="w-4 h-4 text-white" strokeWidth={2.2} />
            </span>
            Annonces récentes
            {!loading && (
              <span className="glass-pill rounded-full px-2.5 py-1 text-[10px] font-bold text-ink-2">{filteredAnnonces.length}</span>
            )}
          </h2>
          <Link to="/annonces" className={LIEN_VOIR_TOUT}>
            Voir tout <ArrowRight className="w-3 h-3" strokeWidth={2.2} />
          </Link>
        </div>

        {erreurFavori && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={2.2} />{erreurFavori}
          </p>
        )}

        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            <Skeleton className="h-[340px] w-[270px] sm:w-[290px] rounded-[22px] shrink-0" count={3} />
          </div>
        ) : filteredAnnonces.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title="Aucune annonce dans cette catégorie."
            action={
              <button
                onClick={() => setActiveCategory('Tout')}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline transition-colors"
              >
                Voir toutes les annonces <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
              </button>
            }
          />
        ) : (
          <>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-1 px-1 sm:grid sm:grid-cols-2 xl:grid-cols-3 sm:gap-4 sm:overflow-visible sm:snap-none">
              {filteredAnnonces.map((annonce) => (
                <div key={annonce._id} className="shrink-0 w-[270px] sm:w-auto snap-start">
                  <AnnonceCard annonce={annonce} estFavori={favoris.includes(annonce._id)} onToggleFavori={toggleFavori} />
                </div>
              ))}
            </div>
            <Link
              to="/annonces"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline py-1"
            >
              Voir toutes les annonces <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
            </Link>
          </>
        )}
      </section>

      {/* ========== BOUTIQUES À DÉCOUVRIR (produits) ========== */}
      {(chargementUnivers || produits.length > 0) && (
        <section className="animate-slide-up space-y-3" style={{ animationDelay: '180ms' }}>
          <EnteteSection gradient={UNIVERS[0].gradient} icon={Store} titre="Boutiques à découvrir" lien="/boutiques" lienLabel="Voir tout" />

          {chargementUnivers ? (
            <div className="flex gap-3 overflow-hidden">
              <Skeleton className="h-60 w-44 rounded-2xl shrink-0" count={3} />
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x -mx-1 px-1">
              {produits.map((p) => {
                const boutique = typeof p.boutique === 'object' ? p.boutique : null;
                return (
                  <Link key={p._id} to={boutique ? `/boutique/${boutique._id}` : '/boutiques'} className="shrink-0 w-44 snap-start no-underline group">
                    <div className="glass rounded-2xl overflow-hidden h-full hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
                      <div className="h-32 relative overflow-hidden">
                        {p.photos?.[0] ? (
                          <img src={p.photos[0]} alt={p.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,122,255,0.08), rgba(94,92,230,0.08))' }}>
                            <Package className="w-5 h-5 text-ink-3" strokeWidth={2.2} />
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 glass-pill rounded-full px-2.5 py-1 text-[11px] font-bold text-ink">
                          {p.prix.toLocaleString('fr-FR')} XOF
                        </div>
                        {p.etat === 'neuf' && (
                          <span className="absolute top-2 right-2 rounded-full bg-blue-500/85 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide">Neuf</span>
                        )}
                        {p.etat === 'occasion' && (
                          <span className="absolute top-2 right-2 rounded-full bg-slate-900/55 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide">Occasion</span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-semibold text-ink truncate">{p.nom}</p>
                        <p className="text-[11px] text-ink-3 truncate mt-1 flex items-center gap-1">
                          <Store className="w-3 h-3 flex-shrink-0" strokeWidth={2.2} />
                          {boutique?.nom || 'Boutique'}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========== RESTAURANTS (plats) ========== */}
      {(chargementUnivers || plats.length > 0) && (
        <section className="animate-slide-up space-y-3" style={{ animationDelay: '240ms' }}>
          <EnteteSection gradient={UNIVERS[1].gradient} icon={UtensilsCrossed} titre="Restaurants" lien="/restaurants" lienLabel="Voir tout" />

          {chargementUnivers ? (
            <div className="flex gap-3 overflow-hidden">
              <Skeleton className="h-60 w-44 rounded-2xl shrink-0" count={3} />
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x -mx-1 px-1">
              {plats.map((p) => {
                const restaurant = typeof p.restaurant === 'object' ? p.restaurant : null;
                return (
                  <Link key={p._id} to={restaurant ? `/restaurant/${restaurant._id}` : '/restaurants'} className="shrink-0 w-44 snap-start no-underline group">
                    <div className="glass rounded-2xl overflow-hidden h-full hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
                      <div className="h-32 relative overflow-hidden">
                        {p.photos?.[0] ? (
                          <img src={p.photos[0]} alt={p.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.10), rgba(255,107,53,0.08))' }}>
                            <UtensilsCrossed className="w-5 h-5 text-ink-3" strokeWidth={2.2} />
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 glass-pill rounded-full px-2.5 py-1 text-[11px] font-bold text-ink">
                          {p.prix.toLocaleString('fr-FR')} XOF
                        </div>
                        {!p.disponible && (
                          <span className="absolute top-2 right-2 rounded-full bg-slate-900/55 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide">Indisponible</span>
                        )}
                        {p.epice && (
                          <span className="absolute top-2 left-2 rounded-full bg-orange-500/85 text-white text-[9px] font-bold px-2 py-0.5 flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5" strokeWidth={2.4} /> Épicé
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-semibold text-ink truncate">{p.nom}</p>
                        <p className="text-[11px] text-ink-3 truncate mt-1 flex items-center gap-1">
                          <UtensilsCrossed className="w-3 h-3 flex-shrink-0" strokeWidth={2.2} />
                          {restaurant?.nom || 'Restaurant'}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========== HÔTELS (chambres) ========== */}
      {(chargementUnivers || chambres.length > 0) && (
        <section className="animate-slide-up space-y-3" style={{ animationDelay: '300ms' }}>
          <EnteteSection gradient={UNIVERS[2].gradient} icon={BedDouble} titre="Hôtels" lien="/hotels" lienLabel="Voir tout" />

          {chargementUnivers ? (
            <div className="flex gap-3 overflow-hidden">
              <Skeleton className="h-60 w-44 rounded-2xl shrink-0" count={3} />
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x -mx-1 px-1">
              {chambres.map((c) => {
                const hotel = typeof c.hotel === 'object' ? c.hotel : null;
                return (
                  <Link key={c._id} to={hotel ? `/hotel/${hotel._id}` : '/hotels'} className="shrink-0 w-44 snap-start no-underline group">
                    <div className="glass rounded-2xl overflow-hidden h-full hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
                      <div className="h-32 relative overflow-hidden">
                        {c.photos?.[0] ? (
                          <img src={c.photos[0]} alt={c.type} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.10), rgba(99,102,241,0.08))' }}>
                            <BedDouble className="w-5 h-5 text-ink-3" strokeWidth={2.2} />
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 glass-pill rounded-full px-2.5 py-1 text-[11px] font-bold text-ink">
                          {c.prixParNuit.toLocaleString('fr-FR')} XOF/nuit
                        </div>
                        {!c.disponible && (
                          <span className="absolute top-2 right-2 rounded-full bg-slate-900/55 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide">Indisponible</span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-semibold text-ink truncate">{c.type}</p>
                        <p className="text-[11px] text-ink-3 truncate mt-1 flex items-center gap-1">
                          <Building2 className="w-3 h-3 flex-shrink-0" strokeWidth={2.2} />
                          {hotel?.nom || 'Hôtel'}
                        </p>
                        <p className="text-[11px] text-ink-3 mt-0.5 flex items-center gap-1">
                          <Users className="w-3 h-3 flex-shrink-0" strokeWidth={2.2} />
                          {c.capacite} personne{c.capacite > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
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
