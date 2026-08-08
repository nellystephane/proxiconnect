import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, Compass, Heart, MessageCircle, Bell, User, Crown,
  Store, UtensilsCrossed, Building2, Bike, PlusCircle, ChevronLeft,
  ChevronRight, X, LogOut, MapPin, Plus, LayoutGrid,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { useChat } from '../../context/ChatContext';
import { useNotifications } from '../../context/NotificationContext';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  badge?: number;
  /** Si défini, l'item n'apparaît que si cet espace pro est actif. */
  requiresEspace?: 'vente' | 'restauration' | 'hotel' | 'livraison';
}

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

const ESPACE_ICON = { vente: Store, restauration: UtensilsCrossed, hotel: Building2, livraison: Bike };
const ESPACE_LABEL = { vente: 'Ma boutique', restauration: 'Mon restaurant', hotel: 'Mon hôtel', livraison: 'Livraison' };

const Sidebar = ({ open, collapsed, onClose, onToggleCollapse }: SidebarProps) => {
  const { user, logout } = useAuth();
  const { espacesActifs } = usePlatform();
  const { nonLus } = useChat();
  const { nonLues } = useNotifications();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const principaux: NavItem[] = [
    { label: 'Tableau de bord', to: '/', icon: LayoutDashboard },
    { label: 'Explorer', to: '/explorer', icon: Compass },
    { label: 'Mon espace', to: '/mon-espace', icon: LayoutGrid },
  ];

  const espacesPro: NavItem[] = (['vente', 'restauration', 'hotel', 'livraison'] as const)
    .filter((id) => espacesActifs[id])
    .map((id) => ({ label: ESPACE_LABEL[id], to: `/${id}`, icon: ESPACE_ICON[id], requiresEspace: id }));

  const activite: NavItem[] = [
    { label: 'Messages', to: '/messages', icon: MessageCircle, badge: nonLus },
    { label: 'Notifications', to: '/notifications', icon: Bell, badge: nonLues },
    { label: 'Favoris', to: '/favoris', icon: Heart },
  ];

  const compte: NavItem[] = [
    { label: 'Abonnement', to: '/abonnements', icon: Crown },
    { label: 'Profil', to: '/profil', icon: User },
  ];

  const renderItem = (item: NavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      onClick={() => mobile && onClose()}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition-all duration-200 ${
          collapsed ? 'justify-center' : ''
        } ${
          isActive
            ? 'btn-liquid-primary shadow-md'
            : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
        }`
      }
    >
      <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2.1} />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!!item.badge && item.badge > 0 && (
        <span
          className={`flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white ${
            collapsed ? 'absolute -top-0.5 -right-0.5 w-4 h-4' : 'ml-auto min-w-[18px] h-[18px] px-1'
          }`}
        >
          {item.badge > 9 ? '9+' : item.badge}
        </span>
      )}
    </NavLink>
  );

  const renderSection = (title: string, items: NavItem[]) => (
    items.length === 0 ? null : (
      <div className="space-y-1">
        {!collapsed && (
          <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
        )}
        {items.map(renderItem)}
      </div>
    )
  );

  return (
    <>
      {/* Voile derrière le drawer mobile */}
      {mobile && open && (
        <div className="fixed inset-0 z-40 glass-overlay animate-fade-in" onClick={onClose} role="presentation" />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col glass-nav !rounded-none lg:!rounded-[24px] lg:my-3 lg:ml-3 lg:h-[calc(100vh-24px)] transition-all duration-300 ease-[var(--ease-smooth)] ${
          collapsed ? 'lg:w-[76px]' : 'lg:w-64'
        } w-72 ${mobile ? (open ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}`}
      >
        {/* En-tête */}
        <div className={`flex items-center gap-2 px-4 h-16 flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/" className="flex items-center gap-2 no-underline min-w-0" onClick={() => mobile && onClose()}>
            <div
              className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--glass-specular), var(--shadow-glow-primary)' }}
            >
              <MapPin className="w-4 h-4" strokeWidth={2.4} />
            </div>
            {!collapsed && <span className="font-bold text-sm text-slate-900 tracking-tight truncate">ProxiConnect</span>}
          </Link>
          {mobile && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-black/[0.04] flex-shrink-0" aria-label="Fermer le menu">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action rapide */}
        <div className="px-3 mb-2">
          <Link
            to="/deposer"
            onClick={() => mobile && onClose()}
            className={`btn-liquid-primary flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm no-underline ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Déposer une annonce' : undefined}
          >
            {collapsed ? <Plus className="w-[18px] h-[18px]" /> : <><PlusCircle className="w-[18px] h-[18px]" /> Déposer une annonce</>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-5 py-2">
          {renderSection('Général', principaux)}
          {renderSection('Mes espaces pro', espacesPro)}
          {renderSection('Activité', activite)}
          {renderSection('Compte', compte)}
        </nav>

        {/* Pied : utilisateur + collapse */}
        <div className="p-3 border-t border-white/40 flex-shrink-0 space-y-1">
          <Link
            to="/profil"
            onClick={() => mobile && onClose()}
            className={`flex items-center gap-2.5 rounded-xl px-2 py-2 no-underline hover:bg-white/60 transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#007AFF] font-bold text-xs overflow-hidden flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.15), rgba(94,92,230,0.15))' }}
            >
              {user?.photo ? <img src={user.photo} alt="" className="w-full h-full object-cover" /> : (user?.prenom?.charAt(0) || 'U')}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{user?.prenom} {user?.nom}</p>
                <p className="text-[11px] text-slate-400 truncate">Voir le profil</p>
              </div>
            )}
          </Link>
          <button
            onClick={logout}
            title={collapsed ? 'Déconnexion' : undefined}
            className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-red-500 hover:bg-red-50/80 transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && 'Déconnexion'}
          </button>
          {!mobile && (
            <button
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-400 hover:bg-white/60 hover:text-slate-600 transition-colors"
              aria-label={collapsed ? 'Étendre le menu' : 'Réduire le menu'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /> Réduire</>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
