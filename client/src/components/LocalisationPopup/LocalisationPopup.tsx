import { useState, useEffect } from 'react';
import { MapPin, X, Check } from 'lucide-react';

export interface LocalisationValue {
  pays: string;
  ville: string;
  quartier: string;
  details: string;
}

interface LocalisationPopupProps {
  open: boolean;
  initialValue?: Partial<LocalisationValue>;
  onClose: () => void;
  onValidate: (value: LocalisationValue) => void;
}

// Quelques villes fréquentes pour accélérer la saisie (l'utilisateur reste libre de taper autre chose)
const VILLES_SUGGESTIONS = [
  'Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Bohicon',
  'Djougou', 'Natitingou', 'Lokossa', 'Ouidah', 'Abomey'
];

const LocalisationPopup: React.FC<LocalisationPopupProps> = ({ open, initialValue, onClose, onValidate }) => {
  const [pays, setPays] = useState(initialValue?.pays || 'Bénin');
  const [ville, setVille] = useState(initialValue?.ville || '');
  const [quartier, setQuartier] = useState(initialValue?.quartier || '');
  const [details, setDetails] = useState(initialValue?.details || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPays(initialValue?.pays || 'Bénin');
      setVille(initialValue?.ville || '');
      setQuartier(initialValue?.quartier || '');
      setDetails(initialValue?.details || '');
      setError('');
    }
  }, [open, initialValue]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleValidate = () => {
    if (!ville.trim()) {
      setError('La ville est obligatoire.');
      return;
    }
    onValidate({ pays: pays.trim(), ville: ville.trim(), quartier: quartier.trim(), details: details.trim() });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto glass rounded-t-3xl md:rounded-3xl shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-white/30 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#007AFF]" />
            <h2 className="text-base font-semibold text-slate-900">Localisation</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Décrivez votre localisation avec vos propres repères : quartier, rue, ou point de repère connu à proximité.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Pays</label>
            <input
              value={pays}
              onChange={(e) => setPays(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Ville *</label>
            <input
              value={ville}
              onChange={(e) => { setVille(e.target.value); setError(''); }}
              list="villes-suggestions"
              placeholder="Cotonou"
              className={`w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:bg-white transition-all ${
                error ? 'border border-red-400 focus:ring-red-300' : 'border border-transparent focus:ring-blue-400'
              }`}
            />
            <datalist id="villes-suggestions">
              {VILLES_SUGGESTIONS.map((v) => <option key={v} value={v} />)}
            </datalist>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Quartier</label>
            <input
              value={quartier}
              onChange={(e) => setQuartier(e.target.value)}
              placeholder="Akpakpa"
              className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">
              Précisions <span className="text-gray-400 normal-case">(points de repère)</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="À côté de la pharmacie Saint-Jean, 2e rue à droite"
              className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all resize-none"
            />
          </div>

          <button
            onClick={handleValidate}
            className="w-full py-3 bg-[#007AFF] text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Valider la localisation
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocalisationPopup;
