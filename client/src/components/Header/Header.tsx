import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Search, Heart, User, LogOut, PlusCircle, LayoutGrid, Crown, Store, MessageCircle, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useNotifications } from '../../context/NotificationContext';

const Header = () => {
  const { user, isConnected, logout } = useAuth();
  const { nonLus } = useChat();
  const { nonLues } = useNotifications();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recherche.trim()) navigate(`/annonces?q=${encodeURIComponent(recherche.trim())}`);
    else navigate('/annonces');
    setShowSearch(false);
  };

  const iconBtn =
    'relative w-9 h-9 flex items-center justify-center rounded-full text-slate-500 transition-all duration-200 ' +
    'hover:bg-black/[0.04] hover:text-slate-700 active:scale-90';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 mx-3 mt-3">
      <div className="glass-nav rounded-[22px] px-4 h-14 flex items-center justify-between transition-shadow duration-300">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2 no-underline">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-300" style={{ background: 'var(--gradient-primary)' }} />
            <div
              className="relative flex h-8 w-8 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-105 group-active:scale-95"
              style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--glass-specular), var(--shadow-glow-primary)' }}
            >
              <MapPin className="w-4 h-4" strokeWidth={2.4} />
            </div>
          </div>
          <span className="font-bold text-sm text-slate-900 tracking-tight">
            ProxiConnect
          </span>
        </Link>

        {/* Actions droite */}
        <div className="flex items-center gap-1">
          {/* Bouton recherche */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`${iconBtn} ${showSearch ? 'text-[#007AFF] bg-[#007AFF]/10' : ''}`}
            aria-label="Rechercher"
          >
            <Search className="w-[18px] h-[18px]" strokeWidth={2.2} />
          </button>

          {isConnected ? (
            <>
              {/* Notifications */}
              <Link to="/notifications" className={iconBtn} aria-label="Mes notifications">
                <Bell className="w-[18px] h-[18px]" strokeWidth={2.2} />
                {nonLues > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white/70" />
                )}
              </Link>

              {/* Messages */}
              <Link to="/messages" className={iconBtn} aria-label="Mes messages">
                <MessageCircle className="w-[18px] h-[18px]" strokeWidth={2.2} />
                {nonLus > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#007AFF] ring-2 ring-white/70" />
                )}
              </Link>

              {/* Favoris */}
              <Link to="/favoris" className={iconBtn} aria-label="Mes favoris">
                <Heart className="w-[18px] h-[18px]" strokeWidth={2.2} />
              </Link>

              {/* Profil utilisateur */}
              <div className="relative ml-1">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#007AFF] font-bold text-sm overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.15), rgba(94,92,230,0.15))', boxShadow: 'var(--glass-specular), var(--shadow-sm)' }}
                >
                  {user?.photo ? <img src={user.photo} alt={user.prenom} className="w-full h-full object-cover" /> : (user?.prenom?.charAt(0) || 'U')}
                </button>

                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 top-12 z-20 w-56 glass-solid rounded-2xl p-2 animate-scale-in origin-top-right">
                      <Link
                        to="/profil"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-[#007AFF]/8 no-underline transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        Profil
                      </Link>
                      <Link
                        to="/profil?onglet=annonces"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-[#007AFF]/8 no-underline transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <LayoutGrid className="w-4 h-4 text-slate-400" />
                        Mes annonces
                      </Link>
                      <Link
                        to="/deposer"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-[#007AFF]/8 no-underline transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <PlusCircle className="w-4 h-4 text-slate-400" />
                        Déposer une annonce
                      </Link>
                      <Link
                        to="/mon-espace"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-[#007AFF]/8 no-underline transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Store className="w-4 h-4 text-slate-400" />
                        Mon espace
                      </Link>
                      <Link
                        to="/abonnements"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-[#007AFF]/8 no-underline transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Crown className="w-4 h-4 text-amber-400" />
                        Abonnements
                      </Link>
                      <div className="my-1 border-t border-slate-200/60" />
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50/80 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 ml-1">
              <Link
                to="/connexion"
                className="px-3.5 h-9 flex items-center rounded-full text-sm font-medium text-slate-600 hover:bg-black/[0.04] transition-colors no-underline"
              >
                Connexion
              </Link>
              <Link
                to="/inscription"
                className="btn-liquid-primary px-3.5 h-9 rounded-full text-sm no-underline"
              >
                Inscription
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Barre de recherche étendue */}
      {showSearch && (
        <form onSubmit={handleSearchSubmit} className="mt-2 glass-solid rounded-[22px] p-3 animate-slide-up">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" strokeWidth={2.2} />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un service..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>
        </form>
      )}
    </header>
  );
};

export default Header;
