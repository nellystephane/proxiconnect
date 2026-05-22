import { Link, useLocation } from 'react-router-dom';
import { Home, Bell, User } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/activite', icon: Bell, label: 'Activité' },
  { to: '/profil', icon: User, label: 'Profil' },
];

const Footer = () => {
  const location = useLocation();

  return (
    <footer className="fixed bottom-3 left-3 right-3 z-50">
      <nav className="glass rounded-2xl px-3 py-1 flex items-center justify-around shadow-sm">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl no-underline transition-all duration-200 ${
                active
                  ? 'bg-blue-50 text-[#007AFF]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
};

export default Footer;