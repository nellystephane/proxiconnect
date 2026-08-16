import { Link, useNavigate } from 'react-router-dom';
import { Eye, Clock, MapPin, Image as ImageIcon, Heart, Sparkles } from 'lucide-react';
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
  const enAvant = annonce.estMiseEnAvant;

  const handleFavoriClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isConnected) { navigate('/connexion'); return; }
    onToggleFavori?.(annonce._id);
  };

  return (
    <Link
      to={`/annonces/${annonce._id}`}
      className={`group glass relative w-full block rounded-[22px] overflow-hidden cursor-pointer transition-all duration-300 ease-[var(--ease-smooth)] hover:-translate-y-1 active:scale-[0.985] ${enAvant ? 'ring-2 ring-amber-400/60 dark:ring-amber-400/40' : ''}`}
      style={{
        boxShadow: `var(--glass-specular), 0 16px 34px -12px ${categoryColor}55, var(--shadow-sm)`,
      }}
      aria-label={`Voir les détails : ${annonce.titre}${enAvant ? ' (annonce mise en avant)' : ''}`}
    >
      {/* Photo */}
      {hasPhotos ? (
        <div className="relative h-40 bg-slate-100 dark:bg-white/5 overflow-hidden">
          <img
            src={annonce.photos[0]}
            alt={annonce.titre}
            className="w-full h-full object-cover transition-transform duration-500 ease-[var(--ease-smooth)] group-hover:scale-[1.06]"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
          {/* Voile dégradé bas pour la lisibilité du badge photos, sans assombrir toute l'image */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-white/5 hidden">
            <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          {annonce.photos.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/45 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
              +{annonce.photos.length - 1}
            </div>
          )}
          {enAvant && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
              <Sparkles className="w-3 h-3" /> En avant
            </div>
          )}
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-white/5 dark:to-white/[0.02] relative">
          <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          {enAvant && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
              <Sparkles className="w-3 h-3" /> En avant
            </div>
          )}
        </div>
      )}

      {onToggleFavori && (
        <button
          onClick={handleFavoriClick}
          className="glass-control absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center"
          aria-label={estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart className={`w-4 h-4 transition-colors ${estFavori ? 'fill-red-500 text-red-500' : 'text-slate-500 dark:text-slate-300'}`} />
        </button>
      )}

      {/* Contenu */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-primary text-xs font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.14), rgba(94,92,230,0.14))' }}
          >
            {annonce.createur?.prenom?.charAt(0) || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {annonce.createur?.prenom} {annonce.createur?.nom?.charAt(0)}.
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{annonce.localisation?.ville}</span>
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 leading-tight">{annonce.titre}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{annonce.description}</p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-900/[0.06] dark:border-white/10">
          <div>
            <span className="text-lg font-bold text-primary">
              {annonce.prix.estGratuit ? 'Gratuit' : `${annonce.prix.montant.toLocaleString('fr-FR')} XOF`}
            </span>
            {annonce.prix.estNegociable && !annonce.prix.estGratuit && (
              <span className="ml-2 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-900/[0.05] dark:bg-white/10 px-2 py-0.5 rounded-full">Négociable</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500">
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
