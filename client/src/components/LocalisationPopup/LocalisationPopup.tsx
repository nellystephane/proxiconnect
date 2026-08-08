import { useState, useEffect } from 'react';
import { MapPin, Check } from 'lucide-react';
import { Modal, Input, Textarea, Button } from '../ui';

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

  const handleValidate = () => {
    if (!ville.trim()) {
      setError('La ville est obligatoire.');
      return;
    }
    onValidate({ pays: pays.trim(), ville: ville.trim(), quartier: quartier.trim(), details: details.trim() });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-4 h-4 text-[#007AFF]" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-900">Localisation</h2>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed mb-4">
        Décrivez votre localisation avec vos propres repères : quartier, rue, ou point de repère connu à proximité.
      </p>

      <div className="space-y-4">
        <Input label="Pays" value={pays} onChange={(e) => setPays(e.target.value)} />

        <div>
          <Input
            label="Ville *"
            value={ville}
            onChange={(e) => { setVille(e.target.value); setError(''); }}
            list="villes-suggestions"
            placeholder="Cotonou"
            error={error}
          />
          <datalist id="villes-suggestions">
            {VILLES_SUGGESTIONS.map((v) => <option key={v} value={v} />)}
          </datalist>
        </div>

        <Input label="Quartier" value={quartier} onChange={(e) => setQuartier(e.target.value)} placeholder="Akpakpa" />

        <Textarea
          label={<>Précisions <span className="text-gray-400 normal-case">(points de repère)</span></>}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="À côté de la pharmacie Saint-Jean, 2e rue à droite"
        />

        <Button onClick={handleValidate} fullWidth icon={<Check className="w-4 h-4" />}>
          Valider la localisation
        </Button>
      </div>
    </Modal>
  );
};

export default LocalisationPopup;
