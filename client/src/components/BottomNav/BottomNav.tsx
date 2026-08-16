import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Compass, MessageCircle, Bell, Heart } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useNotifications } from '../../context/NotificationContext';

// Barre de navigation mobile basse (uniquement < lg) : 5 destinations clés,
// états actifs en pilule "liquid", badges non-lus. Le reste de la navigation
// reste accessible via le drawer ouvert depuis la topbar.
const BottomNav = () => {
  const { nonLus } = useChat();
  const { nonLues } = useNotifications();

  const items = [
    { to: '/', label: 'Accueil', icon: LayoutDashboard, end: true },
    { to: '/explorer', label: 'Explorer', icon: Compass, end: false },
    { to: '/messages', label: 'Messages', icon: MessageCircle, badge: nonLus, end: false },
    { to: '/notifications', label: 'Alertes', icon: Bell, badge: nonLues, end: false },
    { to: '/favoris', label: 'Favoris', icon: Heart, end: false },
  ];

  return (
    <nav className="bottom-nav lg:hidden" aria-label="Navigation principale mobile">
      {items.map(({ to, label, icon: Icon, badge, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        >
          <Icon className="w-[19px] h-[19px]" strokeWidth={2.1} />
          <span>{label}</span>
          {!!badge && badge > 0 && (
            <span className="bottom-nav-badge">{badge > 9 ? '9+' : badge}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
