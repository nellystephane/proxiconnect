import { Link } from 'react-router-dom';
import { Search, MapPin, ChevronRight } from 'lucide-react';

const AccueilConnecte = () => {
  // Pour l'instant, affiche une interface simple avec recherche et suggestions
  return (
    <div className="space-y-6">
      {/* Barre de recherche proéminente */}
      <div className="glass rounded-2xl p-4 flex items-center gap-3 shadow-sm">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Que recherchez-vous ?"
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      {/* Services rapides */}
      <h2 className="text-lg font-semibold text-gray-900">Services populaires</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Électricien', icon: '⚡' },
          { label: 'Plombier', icon: '🔧' },
          { label: 'Couturière', icon: '🧵' },
          { label: 'Coiffeur', icon: '💇' },
        ].map((item) => (
          <Link
            key={item.label}
            to={`/annonces?categorie=${encodeURIComponent(item.label)}`}
            className="glass rounded-2xl p-4 flex items-center gap-3 no-underline hover:shadow-md transition"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
            <ChevronRight className="ml-auto w-4 h-4 text-gray-400" />
          </Link>
        ))}
      </div>

      {/* Annonces récentes (placeholder) */}
      <h2 className="text-lg font-semibold text-gray-900">Annonces récentes</h2>
      <div className="glass rounded-2xl p-6 text-center text-gray-400">
        <p>Aucune annonce pour le moment.</p>
      </div>
    </div>
  );
};

export default AccueilConnecte;