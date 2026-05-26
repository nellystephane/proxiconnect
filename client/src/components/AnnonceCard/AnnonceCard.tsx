import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Clock, MapPin, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

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

// ===== COULEURS PAR CATÉGORIE (pour box-shadow) =====
const getCategorieColor = (categorie: string): string => {
  const colors: Record<string, string> = {
    'Électricité': '#f59e0b',
    'Plomberie': '#3b82f6',
    'Maçonnerie': '#f97316',
    'Peinture': '#a855f7',
    'Menuiserie': '#d97706',
    'Couture': '#ec4899',
    'Coiffure': '#8b5cf6',
    'Esthétique': '#f43f5e',
    'Cours particuliers': '#10b981',
    'Informatique': '#06b6d4',
    'Agriculture': '#22c55e',
    'Vente de produits': '#ef4444',
    'Location': '#6366f1',
    'Transport': '#3b82f6',
    'Autre': '#64748b',
  };
  return colors[categorie] || '#64748b';
};

const AnnonceCard = ({ annonce }: { annonce: Annonce }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Reset photo index when popup opens
  useEffect(() => {
    if (showPopup) {
      setCurrentPhotoIndex(0);
    }
  }, [showPopup]);
  // Close popup with Escape key
  useEffect(() => {
    if (!showPopup) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPopup(false);
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [showPopup]);

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (annonce.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % annonce.photos.length);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (annonce.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + annonce.photos.length) % annonce.photos.length);
    }
  };

  const categoryColor = getCategorieColor(annonce.categorie);
  const hasPhotos = annonce.photos?.length > 0 && annonce.photos[0]?.trim() !== '';

  return (
    <>
      {/* ========== CARTE PRINCIPALE ========== */}
      <article
        onClick={() => setShowPopup(true)}
        className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer transition-all duration-200 hover:border-slate-300 hover:shadow-lg active:scale-[0.99]"
        style={{
          boxShadow: `0 4px 0 0 ${categoryColor}20`, // ombre colorée subtile en bas
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowPopup(true)}
        aria-label={`Voir les détails : ${annonce.titre}`}
      >
        {/* Galerie photo (seulement si photos présentes) */}
        {hasPhotos ? (
          <div className="relative h-40 bg-slate-100">
            <img
              src={annonce.photos[0]}              alt={annonce.titre}
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
              <div className="absolute bottom-2 right-2 flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              </div>
            )}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <MapPin className="w-8 h-8 text-slate-300" />
          </div>
        )}

        {/* Contenu */}
        <div className="p-4 space-y-3">
          {/* Créateur + Localisation */}
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

          {/* Titre + Description */}
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900 line-clamp-2 leading-tight">
              {annonce.titre}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {annonce.description}
            </p>          </div>

          {/* Footer : Prix + Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              <span className="text-lg font-bold text-[#007AFF]">
                {annonce.prix.estGratuit
                  ? 'Gratuit'
                  : `${annonce.prix.montant.toLocaleString('fr-FR')} XOF`}
              </span>
              {annonce.prix.estNegociable && !annonce.prix.estGratuit && (
                <span className="ml-2 text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Négociable
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {annonce.nombreVues}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(annonce.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        </div>

        {/* Indicateur de catégorie (barre colorée en bas) */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1" 
          style={{ backgroundColor: categoryColor }} 
        />
      </article>

      {/* ========== MODAL DÉTAILS ========== */}
      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30"
          onClick={() => setShowPopup(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header avec close */}            <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
              <h2 id="modal-title" className="text-lg font-semibold text-slate-900 pr-8">
                {annonce.titre}
              </h2>
              <button
                onClick={() => setShowPopup(false)}
                className="absolute right-4 top-4 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Contenu scrollable */}
            <div className="px-5 pb-6 pt-4 space-y-5">
              
              {/* Galerie photos (seulement si photos présentes) */}
              {hasPhotos && (
                <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <div className="relative aspect-video">
                    <img
                      src={annonce.photos[currentPhotoIndex]}
                      alt={`${annonce.titre} - Photo ${currentPhotoIndex + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  
                  {/* Navigation si plusieurs photos */}
                  {annonce.photos.length > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
                        aria-label="Photo précédente"
                      >
                        <ChevronLeft className="w-5 h-5 text-slate-700" />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
                        aria-label="Photo suivante"
                      >
                        <ChevronRight className="w-5 h-5 text-slate-700" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {annonce.photos.map((_, i) => (
                          <button                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentPhotoIndex(i);
                            }}
                            className={`w-2 h-2 rounded-full transition-all ${
                              i === currentPhotoIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
                            }`}
                            aria-label={`Aller à la photo ${i + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Créateur */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[#007AFF] font-bold">
                  {annonce.createur?.prenom?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {annonce.createur?.prenom} {annonce.createur?.nom}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {annonce.localisation?.ville}
                    {annonce.localisation?.quartier && ` • ${annonce.localisation.quartier}`}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {annonce.description}
                </p>
              </div>

              {/* Détails localisation */}
              {annonce.localisation?.details && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">📍 Précisions :</span> {annonce.localisation.details}
                  </p>
                </div>
              )}
              {/* Prix + Stats */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Prix</p>
                  <p className="text-xl font-bold text-[#007AFF]">
                    {annonce.prix.estGratuit
                      ? 'Gratuit'
                      : `${annonce.prix.montant.toLocaleString('fr-FR')} XOF`}
                  </p>
                  {annonce.prix.estNegociable && !annonce.prix.estGratuit && (
                    <span className="text-xs text-slate-400">Négociable</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Vues</p>
                  <p className="text-sm font-medium text-slate-700">{annonce.nombreVues}</p>
                </div>
              </div>

              {/* Action */}
              <Link
                to="/inscription"
                className="block w-full text-center bg-[#007AFF] text-white py-3.5 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
              >
                S'inscrire pour contacter
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===== GLOBAL STYLES ===== */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .animate-slide-up {
            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
            transform: translateY(100%);
          }
          @keyframes slideUp {
            to { opacity: 1; transform: translateY(0); }
          }
        }
        .overflow-y-auto {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </>
  );};

export default AnnonceCard;