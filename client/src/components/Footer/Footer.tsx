import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, User, Plus, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItemsConnecte = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/annonces', icon: Search, label: 'Annonces' },
];
const navItemsConnecteDroite = [
  { to: '/favoris', icon: Heart, label: 'Favoris' },
  { to: '/profil', icon: User, label: 'Profil' },
];

const navItemsVisiteur = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/annonces', icon: Search, label: 'Annonces' },
];

const Footer = () => {
  const location = useLocation();
  const { isConnected } = useAuth();

  const estActif = (to: string) => location.pathname === to;

  const NavLink = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => {
    const active = estActif(to);
    return (
      <Link
        to={to}
        className={`relative flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl no-underline transition-all duration-200 active:scale-90 ${
          active ? 'text-[#007AFF]' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        {active && (
          <span className="absolute inset-0 rounded-xl bg-[#007AFF]/10 animate-scale-in" />
        )}
        <Icon className="relative w-5 h-5" strokeWidth={active ? 2.4 : 2} />
        <span className="relative text-[10px] font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <footer className="fixed bottom-3 left-3 right-3 z-50">
      <nav className="glass-nav rounded-[22px] px-3 py-1 flex items-center justify-around relative">
        {isConnected ? (
          <>
            {navItemsConnecte.map((item) => <NavLink key={item.to} {...item} />)}

            {/* Action centrale surélevée : dépôt d'annonce en un geste, où que soit l'utilisateur */}
            <Link
              to="/deposer"
              aria-label="Déposer une annonce"
              className="btn-liquid-primary relative -top-5 h-14 w-14 rounded-full no-underline"
            >
              <Plus className="w-6 h-6" strokeWidth={2.4} />
            </Link>

            {navItemsConnecteDroite.map((item) => <NavLink key={item.to} {...item} />)}
          </>
        ) : (
          <>
            {navItemsVisiteur.map((item) => <NavLink key={item.to} {...item} />)}

            {/* Pour un visiteur, l'action mise en avant est l'inscription, pas le dépôt d'annonce */}
            <Link
              to="/inscription"
              aria-label="Créer un compte"
              className="btn-liquid-primary relative -top-5 h-14 w-14 rounded-full no-underline"
            >
              <UserPlus className="w-6 h-6" strokeWidth={2.4} />
            </Link>

            <NavLink to="/connexion" icon={User} label="Connexion" />
          </>
        )}
      </nav>
    </footer>
  );
};

export default Footer;
