import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Heart, LogOut, User, PlusCircle, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../Sidebar/Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

// ─── Coquille commune à tout l'espace "compte" (dashboard, mon espace,
// messages, notifications, favoris, abonnements, profil, espaces pro...).
// Remplace le Header/Footer public par une vraie sidebar de pilotage +
// une topbar contextuelle, sur un fond "liquid glass" vivant (halos +
// dégradés) plutôt que le gris plat utilisé par le reste du site. ───
const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex relative isolate">
      {/* Halos lumineux fixes propres à l'espace dashboard */}
      <div className="liquid-aurora fixed inset-0 -z-10" aria-hidden="true">
        <span style={{ width: 420, height: 420, top: '-8%', left: '4%', background: 'radial-gradient(circle, rgba(94,92,230,0.16), transparent 70%)' }} />
        <span style={{ width: 480, height: 480, top: '20%', right: '-8%', background: 'radial-gradient(circle, rgba(10,132,255,0.14), transparent 70%)' }} />
        <span style={{ width: 380, height: 380, bottom: '-10%', left: '30%', background: 'radial-gradient(circle, rgba(48,214,196,0.12), transparent 70%)' }} />
      </div>

      <Sidebar
        open={sidebarOpen}
        collapsed={collapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 lg:mt-3 lg:mr-3">
          <div className="glass-nav lg:rounded-[22px] px-4 h-16 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full text-slate-600 hover:bg-black/[0.04] flex-shrink-0"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1 min-w-0 relative hidden sm:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un service, une boutique..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = (e.target as HTMLInputElement).value.trim();
                    navigate(q ? `/annonces?q=${encodeURIComponent(q)}` : '/annonces');
                  }
                }}
                className="w-full max-w-md pl-10 pr-4 py-2.5 bg-white/50 border border-transparent rounded-xl text-sm outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#007AFF] transition-all duration-200"
              />
            </div>
            <button
              onClick={() => navigate('/annonces')}
              className="sm:hidden w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-black/[0.04]"
              aria-label="Rechercher"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>

            <div className="flex-1 sm:hidden" />

            <TopbarQuickActions />

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu((s) => !s)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#007AFF] font-bold text-sm overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.15), rgba(94,92,230,0.15))', boxShadow: 'var(--glass-specular), var(--shadow-sm)' }}
                aria-label="Menu du compte"
              >
                {user?.photo ? <img src={user.photo} alt="" className="w-full h-full object-cover" /> : (user?.prenom?.charAt(0) || 'U')}
              </button>
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 top-12 z-20 w-52 glass-solid rounded-2xl p-2 animate-scale-in origin-top-right">
                    <a href="/profil" onClick={(e) => { e.preventDefault(); setShowProfileMenu(false); navigate('/profil'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-[#007AFF]/8 no-underline transition-colors cursor-pointer">
                      <User className="w-4 h-4 text-slate-400" /> Profil
                    </a>
                    <a href="/abonnements" onClick={(e) => { e.preventDefault(); setShowProfileMenu(false); navigate('/abonnements'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-[#007AFF]/8 no-underline transition-colors cursor-pointer">
                      <Crown className="w-4 h-4 text-amber-400" /> Abonnement
                    </a>
                    <div className="my-1 border-t border-slate-200/60" />
                    <button onClick={() => { setShowProfileMenu(false); handleLogout(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50/80 transition-colors">
                      <LogOut className="w-4 h-4" /> Déconnexion
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-6 pt-5 pb-24 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// Petit lien favoris + dépôt d'annonce dans la topbar (desktop uniquement, la sidebar les propose déjà en mobile)
const TopbarQuickActions = () => {
  const navigate = useNavigate();
  return (
    <div className="hidden md:flex items-center gap-1">
      <button
        onClick={() => navigate('/favoris')}
        className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-black/[0.04] hover:text-slate-700 transition-all duration-200 active:scale-90"
        aria-label="Mes favoris"
      >
        <Heart className="w-[18px] h-[18px]" />
      </button>
      <button
        onClick={() => navigate('/deposer')}
        className="btn-liquid-primary flex items-center gap-1.5 rounded-full px-3.5 h-9 text-sm ml-1"
      >
        <PlusCircle className="w-4 h-4" /> Déposer
      </button>
    </div>
  );
};

export default DashboardLayout;
