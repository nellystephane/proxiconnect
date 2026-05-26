import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Clock, MapPin, X } from 'lucide-react';

// Interface correspondant à la structure d'une annonce
interface Annonce {
  _id: string;
  titre: string;
  description: string;
  categorie: string;
  prix: { montant: number; estNegociable: boolean; estGratuit: boolean };
  photos: string[];
  localisation: { ville: string; quartier: string; details?: string };
  createur: { nom: string; prenom: string };
  nombreVues: number;
  createdAt: string;
}

const AnnonceCard = ({ annonce }: { annonce: Annonce }) => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
      {/* ========== CARTE ========== */}
      <div
        onClick={() => setShowPopup(true)}
        className="glass rounded-2xl p-5 cursor-pointer hover:shadow-lg transition space-y-4"
      >
        {/* En-tête avec avatar et localisation */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#007AFF] font-bold">
            {annonce.createur?.prenom?.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {annonce.createur?.prenom} {annonce.createur?.nom}
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {annonce.localisation?.ville || 'Localisation inconnue'}
            </p>
          </div>
        </div>

        {/* Titre et description */}
        <h3 className="font-bold text-gray-900 line-clamp-2">{annonce.titre}</h3>
        <p className="text-gray-500 text-sm line-clamp-2">{annonce.description}</p>

        {/* Statistiques */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {annonce.nombreVues} vues
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(annonce.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>

        {/* Prix */}
        <div className="pt-2 border-t border-gray-100">
          <span className="font-bold text-blue-600">
            {annonce.prix.estGratuit
              ? 'Gratuit'
              : `${annonce.prix.montant.toLocaleString()} XOF`}
          </span>
          {annonce.prix.estNegociable && !annonce.prix.estGratuit && (
            <span className="text-gray-400 text-xs ml-2">(négociable)</span>
          )}
        </div>
      </div>

      {/* ========== POPUP DÉTAIL ========== */}
      {showPopup && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête du popup */}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-xl text-gray-900">{annonce.titre}</h2>
              <button
                onClick={() => setShowPopup(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Info créateur */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#007AFF] font-bold">
                {annonce.createur?.prenom?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {annonce.createur?.prenom} {annonce.createur?.nom}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {annonce.localisation?.ville || 'Localisation inconnue'}
                  {annonce.localisation?.quartier && ` - ${annonce.localisation.quartier}`}
                </p>
              </div>
            </div>

            {/* Description complète */}
            <p className="text-gray-700 text-sm">{annonce.description}</p>

            {/* Détails localisation */}
            {annonce.localisation?.details && (
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                <strong>📍 Précisions :</strong> {annonce.localisation.details}
              </div>
            )}

            {/* Prix et vues */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="font-bold text-blue-600 text-lg">
                {annonce.prix.estGratuit
                  ? 'Gratuit'
                  : `${annonce.prix.montant.toLocaleString()} XOF`}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Eye className="w-3 h-3" /> {annonce.nombreVues} vues
              </span>
            </div>

            {/* Appel à l'action (si visiteur) */}
            <Link
              to="/inscription"
              className="block w-full text-center bg-[#007AFF] text-white py-3 rounded-xl font-semibold no-underline hover:bg-blue-600 transition"
            >
              S'inscrire pour contacter
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default AnnonceCard;