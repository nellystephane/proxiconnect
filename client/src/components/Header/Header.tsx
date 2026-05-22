import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Search, SlidersHorizontal, User, LogOut, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 mx-3 mt-3">
      <div className="glass rounded-2xl px-4 h-14 flex items-center justify-between shadow-sm">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2 no-underline">
          <div className="relative">
            <div className="absolute inset-0 bg-[#007AFF] rounded-lg blur opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#007AFF] to-indigo-600 shadow-md shadow-blue-500/20 transition-transform duration-300 group-hover:scale-105">
              <MapPin className="w-4 h-4 text-white" />
            </div>
          </div>
          <span className="font-bold text-sm text-gray-900 tracking-tight">
            ProxiConnect
          </span>
        </Link>

        {/* Actions droite */}
        <div className="flex items-center gap-2">
          {/* Bouton recherche */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition ${
              showSearch
                ? 'bg-blue-100 text-[#007AFF]'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Bouton filtres (optionnel) */}
          <button className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition">
            <SlidersHorizontal className="w-5 h-5" />
          </button>

          {/* Profil utilisateur */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-[#007AFF] font-bold text-sm shadow-sm hover:shadow transition"
            >
              {user?.prenom?.charAt(0) || 'U'}
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 top-12 z-20 w-48 glass rounded-2xl p-2 shadow-lg animate-scale-in">
                  <Link
                    to="/profil"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-blue-50 no-underline transition"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    Profil
                  </Link>
                  <Link
                    to="/deposer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-blue-50 no-underline transition"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <PlusCircle className="w-4 h-4" />
                    Déposer une annonce
                  </Link>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Barre de recherche étendue */}
      {showSearch && (
        <div className="mt-2 glass rounded-2xl p-3 animate-slide-up">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un service..."
              className="flex-1 bg-transparent text-sm outline-none"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;