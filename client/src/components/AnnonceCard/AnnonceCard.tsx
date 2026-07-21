import { Link, useNavigate } from 'react-router-dom';
import { Eye, Clock, MapPin, Image as ImageIcon, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCategorieColor } from '../../utils/categories';
import type { Annonce } from '../../types';

interface AnnonceCardProps {
  annonce: Annonce;
  estFavori?: boolean;
  onToggleFavori?: (id: string) => void;
}

const AnnonceCard = ({ annonce, estFavori, onToggleFavori }: AnnonceCardProps) => {
  const navigate = useNavigate();
  const { isConnected } = useAuth();

  const categoryColor = getCategorieColor(annonce.categorie);
  const hasPhotos = annonce.photos?.length > 0 && annonce.photos[0]?.trim() !== '';

  const handleFavoriClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isConnected) { navigate('/connexion'); return; }
    onToggleFavori?.(annonce._id);
  };

  return (
    <Link
      to={`/annonces/${annonce._id}`}
      className="group relative w-full block bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg active:scale-[0.99]"
      style={{
        boxShadow: `0 12px 30px -8px ${categoryColor}60, 0 4px 6px rgba(0,0,0,0.05)`,
      }}
      aria-label={`Voir les détails : ${annonce.titre}`}
    >
      {/* Photo */}
      {hasPhotos ? (
        <div className="relative h-40 bg-slate-100">
          <img
            src={annonce.photos[0]}
            alt={annonce.titre}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 hidden">
            <ImageIcon className="w-8 h-8 text-slate-300" />
          </div>
          {annonce.photos.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
              +{annonce.photos.length - 1}
            </div>
          )}
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <MapPin className="w-8 h-8 text-slate-300" />
        </div>
      )}

      {onToggleFavori && (
        <button
          onClick={handleFavoriClick}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-white transition"
          aria-label={estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart className={`w-4 h-4 transition-colors ${estFavori ? 'fill-red-500 text-red-500' : 'text-slate-500'}`} />
        </button>
      )}

      {/* Contenu */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#007AFF] text-xs font-bold">
            {annonce.createur?.prenom?.charAt(0) || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {annonce.createur?.prenom} {annonce.createur?.nom?.charAt(0)}.
            </p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{annonce.localisation?.ville}</span>
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold text-slate-900 line-clamp-2 leading-tight">{annonce.titre}</h3>
          <p className="text-xs text-slate-500 line-clamp-2">{annonce.description}</p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <span className="text-lg font-bold text-[#007AFF]">
              {annonce.prix.estGratuit ? 'Gratuit' : `${annonce.prix.montant.toLocaleString('fr-FR')} XOF`}
            </span>
            {annonce.prix.estNegociable && !annonce.prix.estGratuit && (
              <span className="ml-2 text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Négociable</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{annonce.nombreVues}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(annonce.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AnnonceCard;
