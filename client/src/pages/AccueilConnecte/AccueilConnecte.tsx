import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import AnnonceCard from '../../components/AnnonceCard/AnnonceCard.tsx';
import API from '../../api/axios.ts';
import { Plus, Filter, ChevronDown, Sparkles, LayoutGrid, ArrowRight } from 'lucide-react';

interface Annonce {
  _id: string;
  titre: string;
  description: string;
  categorie: string;
  prix: { montant: number; estNegociable: boolean; estGratuit: boolean };
  photos: string[];
  localisation: { ville: string; quartier: string };
  createur: { nom: string; prenom: string };
  nombreVues: number;
  createdAt: string;
}

const AccueilConnecte = () => {
  const { user } = useAuth();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
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
    <div className="relative min-h-screen pb-24 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 animate-fade-in">
      
      {/* ========== HEADER COMPACT ========== */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60 dark:border-slate-700/50">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-[#007AFF] mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Espace membre</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Bonjour, <span className="text-[#007AFF]">{user?.prenom || 'Membre'}</span> 👋
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
                  : 'bg-white/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50 hover:border-blue-400/50 hover:bg-blue-50/50 dark:hover:bg-slate-700/50'
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
                    ? 'border-[#007AFF] text-[#007AFF] bg-blue-50/50 dark:bg-blue-900/20'
                    : 'border-slate-200/60 dark:border-slate-700/50 text-slate-500 hover:border-blue-400/50'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Autres
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showMoreDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              <div
                className={`absolute top-full left-0 mt-2 w-44 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl z-50 p-1 transition-all duration-300 origin-top ${
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
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-[#007AFF] transition-colors"
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
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-xs font-medium text-[#007AFF] animate-fade-in">
            Filtre actif : {activeCategory}
            <button onClick={() => setActiveCategory('Tout')} className="hover:text-red-500 transition-colors ml-1">✕</button>
          </div>
        )}
      </section>

      {/* ========== GRILLE / LOADING / EMPTY ========== */}      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/40 p-4 animate-pulse h-72 backdrop-blur-sm"
            />
          ))}
        </div>
      ) : filteredAnnonces.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <LayoutGrid className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Aucune annonce dans cette catégorie.</p>
          <button
            onClick={() => setActiveCategory('Tout')}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#007AFF] hover:underline transition-colors"
          >
            Voir toutes les annonces <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnnonces.map((annonce) => (
            <AnnonceCard key={annonce._id} annonce={annonce} />
          ))}
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