import { useState } from 'react';
import { MapPin, Navigation, X, Loader2, Check } from 'lucide-react';
import { Textarea, Input } from '../ui';
import type { DestinationLivraison as DestinationLivraisonValue } from '../../types';

interface Props {
  value: DestinationLivraisonValue;
  onChange: (value: DestinationLivraisonValue) => void;
  /** Affiche les champs Ville/Quartier séparément (utile quand le vendeur en a besoin pour filtrer). Par défaut : oui. */
  afficherVilleQuartier?: boolean;
}

// ─── Localisation d'une commande, pensée pour le terrain ouest-africain :
// la description humaine du lieu ("dernière maison à gauche dans la von...")
// est le repère principal et OBLIGATOIRE dès qu'une livraison est demandée.
// Le point GPS n'est qu'un complément FACULTATIF, capté via l'API
// Geolocation native du navigateur — pas de clé Google Maps nécessaire, le
// lien généré (https://www.google.com/maps?q=lat,lng) s'ouvre dans
// n'importe quelle application de cartographie du téléphone. ───
const DestinationLivraison = ({ value, onChange, afficherVilleQuartier = true }: Props) => {
  const [recherche, setRecherche] = useState(false);
  const [erreurGps, setErreurGps] = useState('');

  const ajouterPosition = () => {
    if (!navigator.geolocation) {
      setErreurGps("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setErreurGps('');
    setRecherche(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onChange({
          ...value,
          latitude,
          longitude,
          mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
        });
        setRecherche(false);
      },
      (err) => {
        setRecherche(false);
        setErreurGps(
          err.code === err.PERMISSION_DENIED
            ? "Position refusée. Ce n'est pas grave, la description suffit."
            : "Impossible de récupérer votre position pour le moment."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const retirerPosition = () => {
    onChange({ ...value, latitude: null, longitude: null, mapUrl: '', formattedAddress: '' });
  };

  const positionAjoutee = typeof value.latitude === 'number' && typeof value.longitude === 'number';

  return (
    <div className="space-y-3">
      {afficherVilleQuartier && (
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={value.ville || ''}
            onChange={(e) => onChange({ ...value, ville: e.target.value })}
            placeholder="Ville"
          />
          <Input
            value={value.quartier || ''}
            onChange={(e) => onChange({ ...value, quartier: e.target.value })}
            placeholder="Quartier"
          />
        </div>
      )}

      {/* Localisation GPS — facultative */}
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary" /> Localisation sur la carte
          <span className="font-normal text-slate-400 normal-case">— Facultatif</span>
        </p>
        {positionAjoutee ? (
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5" /> Position ajoutée
            </span>
            <button type="button" onClick={retirerPosition} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 p-1" aria-label="Retirer la position">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={ajouterPosition}
            disabled={recherche}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl glass-light text-sm font-medium text-slate-600 hover:bg-primary/10 hover:text-primary transition-all duration-200 disabled:opacity-60"
          >
            {recherche ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {recherche ? 'Recherche de votre position…' : 'Ajouter ma position'}
          </button>
        )}
        {erreurGps && <p className="text-[11px] text-amber-600 mt-1.5">{erreurGps}</p>}
      </div>

      {/* Description du lieu — obligatoire */}
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-1.5">
          Comment trouver votre domicile / lieu de livraison ? <span className="text-red-400">*</span>
        </p>
        <Textarea
          value={value.details || ''}
          onChange={(e) => onChange({ ...value, details: e.target.value })}
          placeholder="Ex : après l'école primaire, dernière maison à gauche dans la von, portail bleu."
          rows={3}
        />
      </div>
    </div>
  );
};

export default DestinationLivraison;
