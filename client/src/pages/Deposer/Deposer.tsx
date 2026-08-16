import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  X,
  Plus,
  Sparkles,
  MapPin,
  Check,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  AlertCircle,
  ChevronDown,
  Eye,
  PenLine,
  Camera,
} from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';
import API from '../../api/axios.ts';
import { Spinner } from '../../components/ui';
import { CATEGORIES } from '../../utils/categories';
import type { CategoryOption } from '../../utils/categories';

// ===== TYPES =====
interface FormType {
  titre: string;
  description: string;
  categorie: string;
  sousCategorie: string;
  type: 'service' | 'vente' | 'autre';
  montant: string;
  estNegociable: boolean;
  estGratuit: boolean;
  photos: PhotoItem[];
  pays: string;
  ville: string;
  quartier: string;
  details: string;
}

interface PhotoItem {
  id: string;
  url: string;
}

// Correction : FormErrors accepte toutes les clés de FormType
type FormErrors = Partial<Record<keyof FormType, string>>;

// ===== DONNEES =====
// Les catégories proviennent de la source partagée (tuiles visuelles) ;
// les types d'annonce restent locaux au formulaire.
const TYPES: CategoryOption[] = [
  { value: 'service', label: 'Service', color: '#3b82f6' },
  { value: 'vente', label: 'Vente', color: '#10b981' },
  { value: 'autre', label: 'Autre', color: '#64748b' },
];

const STEPS = [
  { id: 'infos', label: 'Informations', icon: Sparkles },
  { id: 'photos', label: 'Photos', icon: ImageIcon },
  { id: 'localisation', label: 'Localisation', icon: MapPin },
];

interface DeposerProps {
  onClose?: () => void;
}

// ===== COMPOSANTS EXTERNES (memorisés) =====

// Message d'erreur inline sous un champ
const ErrorMessage = memo(({ error }: { error?: string }) => {
  if (!error) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1.5 animate-fade-in">
      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      <span className="text-xs text-red-500 font-medium">{error}</span>
    </div>
  );
});

// En-tête de champ : label, optionnel, erreur, aide contextuelle
const FieldWrapper = memo(({
  children,
  label,
  required,
  error,
  touched,
  helper,
}: {
  children: React.ReactNode;
  label: string;
  required?: boolean;
  error?: string;
  touched: boolean;
  name: string;
  helper?: string;
}) => {
  const hasError = !!error && touched;
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hasError && <ErrorMessage error={error} />}
      {helper && !hasError && <span className="text-[11px] text-slate-400">{helper}</span>}
    </div>
  );
});

// Interrupteur "liquid" (Gratuit / Négociable)
const ToggleSwitch = memo(({
  checked,
  onChange,
  label,
  disabled = false
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) => (
  <label className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
    disabled
      ? 'border-slate-200/70 opacity-50 cursor-not-allowed'
      : checked
        ? 'border-primary/30 bg-primary/5'
        : 'border-slate-200 glass-light hover:border-slate-300'
  }`}>
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
      checked ? 'bg-primary' : 'bg-slate-300/80'
    } ${disabled ? 'opacity-60' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </div>
  </label>
));

// Champ texte avec états validation / validé / erreur + compteur de caractères
const TextInput = memo(({
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  error,
  touched,
  type = 'text',
  maxLength,
  suffix,
  helper,
}: {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  touched: boolean;
  type?: string;
  maxLength?: number;
  suffix?: string;
  helper?: string;
}) => {
  const hasError = !!error && touched;
  const isValid = !hasError && touched && value && value.trim().length > 0;

  return (
    <FieldWrapper label={name.charAt(0).toUpperCase() + name.slice(1)} required={required} error={error} touched={touched} name={name} helper={helper}>
      <div className="relative">
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          className={`w-full px-4 py-3 bg-white/60 border rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${
            hasError
              ? 'border-red-300 bg-red-50/60 ring-2 ring-red-100 focus:border-red-400 focus:ring-red-200'
              : isValid
                ? 'border-emerald-300/70 bg-emerald-50/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100/60'
                : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/15'
          } ${suffix ? 'pr-12 text-right font-semibold' : ''}`}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{suffix}</span>
        )}
        {isValid && !suffix && (
          <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
        )}
      </div>
      {maxLength && (
        <div className={`text-right text-[10px] transition-colors ${
          value.length > maxLength * 0.9 ? 'text-amber-500 font-medium' : 'text-slate-400'
        }`}>
          {value.length}/{maxLength}
        </div>
      )}
    </FieldWrapper>
  );
});

// Zone de texte multi-lignes (se valide à partir de 20 caractères)
const TextArea = memo(({
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  error,
  touched,
  rows = 4,
  maxLength,
  helper,
}: {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  touched: boolean;
  rows?: number;
  maxLength?: number;
  helper?: string;
}) => {
  const hasError = !!error && touched;
  const isValid = !hasError && touched && value && value.trim().length >= 20;

  return (
    <FieldWrapper label={name.charAt(0).toUpperCase() + name.slice(1)} required={required} error={error} touched={touched} name={name} helper={helper}>
      <div className="relative">
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          rows={rows}
          maxLength={maxLength}
          className={`w-full px-4 py-3 bg-white/60 border rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all resize-none ${
            hasError
              ? 'border-red-300 bg-red-50/60 ring-2 ring-red-100 focus:border-red-400 focus:ring-red-200'
              : isValid
                ? 'border-emerald-300/70 bg-emerald-50/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100/60'
                : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/15'
          }`}
        />
        {isValid && (
          <Check className="absolute right-3 top-3 w-4 h-4 text-emerald-500" />
        )}
      </div>
      {maxLength && (
        <div className={`text-right text-[10px] transition-colors ${
          value.length > maxLength * 0.9 ? 'text-red-500 font-medium' : value.length > maxLength * 0.8 ? 'text-amber-500 font-medium' : 'text-slate-400'
        }`}>
          {value.length}/{maxLength}
        </div>
      )}
    </FieldWrapper>
  );
});

// Titre commun à chaque étape : pastille dégradée + intitulé + aide
const StepTitle = memo(({
  icon: Icon,
  titre,
  aide,
}: {
  icon: React.ComponentType<{ className?: string }>;
  titre: string;
  aide: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
      <Icon className="w-[18px] h-[18px]" />
    </div>
    <div className="min-w-0">
      <h3 className="text-base font-bold text-slate-900 leading-tight">{titre}</h3>
      <p className="text-xs text-slate-400 mt-1">{aide}</p>
    </div>
  </div>
));

// Sélecteur de catégories en tuiles visuelles (15 catégories riches :
// pastille de couleur + libellé + coche de sélection)
const CategorieTiles = memo(({
  value,
  onSelect,
  error,
  touched,
}: {
  value: string;
  onSelect: (value: string) => void;
  error?: string;
  touched: boolean;
}) => {
  const hasError = !!error && touched;
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Catégorie <span className="text-red-400 ml-0.5">*</span>
      </label>
      <div
        role="listbox"
        aria-label="Catégorie de l'annonce"
        className={`grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-2xl p-2 transition-all ${
          hasError ? 'bg-red-50/60 ring-2 ring-red-100' : 'bg-slate-500/[0.04]'
        }`}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = cat.value === value;
          return (
            <button
              key={cat.value}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(cat.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 active:scale-[0.97] ${
                isSelected
                  ? 'border-primary/60 bg-primary/5 shadow-[var(--shadow-sm)]'
                  : 'border-slate-200 glass-light hover:border-slate-300'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className={`flex-1 text-[13px] font-medium leading-tight ${
                isSelected ? 'text-slate-900' : 'text-slate-600'
              }`}>
                {cat.label}
              </span>
              {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
            </button>
          );
        })}
      </div>
      {hasError && <ErrorMessage error={error} />}
      {!hasError && <p className="text-[11px] text-slate-400">Choisissez la catégorie la plus proche de votre offre.</p>}
    </div>
  );
});

// Type d'annonce en segments "pilule" (Service / Vente / Autre)
const TypeSegments = memo(({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (value: string) => void;
}) => (
  <div className="space-y-2">
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
      Type d'annonce
    </label>
    <div className="flex p-1.5 gap-1.5 rounded-full glass-light" role="radiogroup" aria-label="Type d'annonce">
      {TYPES.map((t) => {
        const isSelected = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(t.value)}
            className={`flex-1 px-3 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
              isSelected ? 'text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
            style={isSelected ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow-primary)' } : undefined}
          >
            {t.label}
          </button>
        );
      })}
    </div>
    <p className="text-[11px] text-slate-400">Un service proposé, la vente d'un bien, ou autre chose.</p>
  </div>
));

// En-tête de l'assistant : stepper en pilules (fait / actif / à venir)
// + barre segmentée + pourcentage
const StepIndicator = memo(({ currentStep, onStepClick }: { currentStep: number; onStepClick: (index: number) => void }) => {
  const progression = Math.round(((currentStep + 1) / STEPS.length) * 100);

  return (
    <div className="mt-5">
      {/* Pilules d'étapes cliquables (l'avance reste soumise à la validation) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {STEPS.map((step, i) => {
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onStepClick(i)}
                aria-current={isActive ? 'step' : undefined}
                className={`flex items-center gap-2 h-10 px-3 sm:px-4 rounded-full text-sm font-semibold transition-all duration-300 active:scale-[0.97] ${
                  isActive
                    ? 'text-white'
                    : isCompleted
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20'
                      : 'glass-light text-slate-400 hover:text-slate-600'
                }`}
                style={isActive ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow-primary)' } : undefined}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-300/70 text-slate-500'
                }`}>
                  {isCompleted ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                </span>
                <span className="hidden sm:inline truncate">{step.label}</span>
                {!isActive && !isCompleted && <span className="sm:hidden text-[10px]">{i + 1}</span>}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`hidden sm:block h-px w-4 xl:w-6 flex-shrink-0 transition-colors duration-300 ${
                  isCompleted ? 'bg-emerald-400/60' : 'bg-slate-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Barre segmentée + pourcentage */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 flex gap-1.5 h-1.5">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex-1 h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: i <= currentStep ? '100%' : '0%', background: 'var(--gradient-primary)' }}
              />
            </div>
          ))}
        </div>
        <span className="text-xs font-bold text-primary tabular-nums">{progression}%</span>
      </div>
    </div>
  );
});

// ===== APERÇU EN TEMPS RÉEL =====
// Reflète l'état du formulaire sous la forme d'une carte immersive proche de
// celle qui sera visible publiquement (AnnonceCard), sans dépendre d'un
// _id/createur puisque l'annonce n'existe pas encore côté serveur à ce stade.
const PreviewAnnonce = memo(({ form }: { form: FormType }) => {
  const categorieInfo = CATEGORIES.find((c) => c.value === form.categorie);
  const premierePhoto = form.photos.find((p) => p.url)?.url;
  const nbPhotos = form.photos.filter((p) => p.url && p.url.trim() !== '').length;
  const localisationTexte = [form.quartier, form.ville].filter(Boolean).join(', ');

  return (
    <div
      className="glass rounded-[22px] overflow-hidden animate-scale-in"
      style={categorieInfo ? {
        boxShadow: `var(--glass-specular), 0 16px 34px -12px ${categorieInfo.color}55, var(--shadow-sm)`,
      } : undefined}
    >
      {/* Zone immersive : photo (ou placeholder) + chip catégorie flottante */}
      <div className="relative h-40">
        {premierePhoto ? (
          <>
            <img src={premierePhoto} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
            {nbPhotos > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/45 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                +{nbPhotos - 1}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-white/5 dark:to-white/[0.02]">
            <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
        )}
        {categorieInfo && (
          <span
            className="glass-pill absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{ color: categorieInfo.color }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categorieInfo.color }} />
            {categorieInfo.label}
          </span>
        )}
      </div>

      {/* Contenu : titre, description, prix, localisation */}
      <div className="p-4 space-y-2.5">
        <h4 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
          {form.titre || 'Titre de votre annonce'}
        </h4>
        {form.description && (
          <p className="text-xs text-slate-500 line-clamp-3">{form.description}</p>
        )}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-900/[0.06] dark:border-white/10">
          <span className="text-base font-bold text-primary">
            {form.estGratuit ? 'Gratuit' : form.montant ? `${Number(form.montant).toLocaleString('fr-FR')} XOF` : '—'}
          </span>
          {form.estNegociable && !form.estGratuit && (
            <span className="text-[10px] text-slate-500 bg-slate-900/[0.05] dark:bg-white/10 px-2 py-0.5 rounded-full">Négociable</span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{localisationTexte || 'Localisation à définir'}</span>
        </p>
      </div>
    </div>
  );
});

// ===== COMPOSANT PRINCIPAL =====
const Deposer: React.FC<DeposerProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { id: annonceId } = useParams<{ id?: string }>();
  const isEditMode = !!annonceId;

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAnnonce, setLoadingAnnonce] = useState(isEditMode);
  // Panneau d'aperçu repliable en bas de page sur mobile / tablette
  const [apercuOuvert, setApercuOuvert] = useState(false);

  const [form, setForm] = useState<FormType>({
    titre: '',
    description: '',
    categorie: '',
    sousCategorie: '',
    type: 'service',
    montant: '',
    estNegociable: false,
    estGratuit: false,
    photos: [],
    pays: 'Bénin',
    ville: '',
    quartier: '',
    details: '',
  });

  // En mode édition, charger l'annonce existante et préremplir le formulaire
  useEffect(() => {
    if (!isEditMode) return;
    let annule = false;
    (async () => {
      try {
        const { data } = await API.get(`/annonces/${annonceId}`);
        if (annule) return;
        setForm({
          titre: data.titre || '',
          description: data.description || '',
          categorie: data.categorie || '',
          sousCategorie: data.sousCategorie || '',
          type: data.type || 'service',
          montant: data.prix?.estGratuit ? '' : String(data.prix?.montant ?? ''),
          estNegociable: data.prix?.estNegociable ?? false,
          estGratuit: data.prix?.estGratuit ?? false,
          photos: (data.photos || []).map((url: string) => ({ id: `${Date.now()}-${Math.random().toString(36).substr(2, 8)}`, url })),
          pays: data.localisation?.pays || 'Bénin',
          ville: data.localisation?.ville || '',
          quartier: data.localisation?.quartier || '',
          details: data.localisation?.details || '',
        });
      } catch (err) {
        setGlobalError("Impossible de charger cette annonce pour modification.");
      } finally {
        if (!annule) setLoadingAnnonce(false);
      }
    })();
    return () => { annule = true; };
  }, [annonceId, isEditMode]);

  // Helper: generate unique id for photo items
  const generatePhotoId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

  // Validation pure (sans dépendance extérieure)
  const validateField = useCallback((name: keyof FormType, value: any, estGratuit: boolean): string | undefined => {
    switch (name) {
      case 'titre':
        if (!value || value.trim().length === 0) return 'Le titre est obligatoire';
        if (value.trim().length < 5) return 'Le titre doit contenir au moins 5 caractères';
        if (value.trim().length > 100) return 'Le titre ne doit pas dépasser 100 caractères';
        return undefined;
      case 'description':
        if (!value || value.trim().length === 0) return 'La description est obligatoire';
        if (value.trim().length < 20) return 'La description doit contenir au moins 20 caractères';
        if (value.trim().length > 500) return 'La description ne doit pas dépasser 500 caractères';
        return undefined;
      case 'categorie':
        if (!value) return 'Veuillez sélectionner une catégorie';
        return undefined;
      case 'ville':
        if (!value || value.trim().length === 0) return 'La ville est obligatoire';
        return undefined;
      case 'montant':
        if (!estGratuit && value && value !== '') {
          const num = Number(value);
          if (isNaN(num) || num < 0) return 'Le montant doit être un nombre positif';
        }
        return undefined;
      default:
        return undefined;
    }
  }, []);

  // Validation d'une étape complète
  const validateStep = useCallback((stepIndex: number, formData: FormType): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (stepIndex === 0) {
      const titreError = validateField('titre', formData.titre, formData.estGratuit);
      if (titreError) { newErrors.titre = titreError; isValid = false; }

      const descriptionError = validateField('description', formData.description, formData.estGratuit);
      if (descriptionError) { newErrors.description = descriptionError; isValid = false; }

      const categorieError = validateField('categorie', formData.categorie, formData.estGratuit);
      if (categorieError) { newErrors.categorie = categorieError; isValid = false; }

    }

    if (stepIndex === 2) {
      const villeError = validateField('ville', formData.ville, formData.estGratuit);
      if (villeError) { newErrors.ville = villeError; isValid = false; }
    }

    setErrors(newErrors);
    return isValid;
  }, [validateField]);

  // Validation complète pour submit
  const validateAllSteps = useCallback((formData: FormType): boolean => {
    return validateStep(0, formData) && validateStep(2, formData);
  }, [validateStep]);

  // Mise à jour des erreurs en temps réel (uniquement sur champs touchés)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newErrors: FormErrors = {};
      const fieldsToValidate: (keyof FormType)[] = ['titre', 'description', 'categorie', 'ville', 'montant'];

      fieldsToValidate.forEach(field => {
        if (touched[field]) {
          const error = validateField(field, form[field], form.estGratuit);
          if (error) {
            newErrors[field] = error;
          }
        }
      });

      setErrors(newErrors);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [form.titre, form.description, form.categorie, form.ville, form.montant, form.estGratuit, touched, validateField]);

  // Handlers
  // Fermeture : prop onClose (usage modale) ou retour arrière (usage route)
  const handleClose = useCallback(() => {
    if (onClose) onClose();
    else navigate(-1);
  }, [navigate, onClose]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setForm(prev => ({ ...prev, [name]: val }));
    setGlobalError('');
  }, []);

  const handleBlur = useCallback((name: keyof FormType) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  // Sélection d'une catégorie / d'un type depuis les tuiles et segments
  const handleSelect = useCallback((field: 'categorie' | 'type', value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    setGlobalError('');
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex > currentStep) {
      if (!validateStep(currentStep, form)) {
        const stepFields: Record<number, (keyof FormType)[]> = {
          0: ['titre', 'description', 'categorie'],
          1: [],
          2: ['ville'],
        };
        const fieldsToTouch = stepFields[currentStep] || [];
        setTouched(prev => {
          const next = { ...prev };
          fieldsToTouch.forEach(f => { next[f] = true; });
          return next;
        });
        return;
      }
    }
    setCurrentStep(stepIndex);
    setGlobalError('');
    // Recentre la lecture en haut de l'assistant à chaque changement d'étape
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentStep, form, validateStep]);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  // Photo handlers with stable keys
  const addPhotoField = useCallback(() => {
    if (form.photos.length < 6) {
      setForm(prev => ({ ...prev, photos: [...prev.photos, { id: generatePhotoId(), url: '' }] }));
    }
  }, [form.photos.length]);

  const handlePhotoChange = useCallback((index: number, url: string) => {
    setForm(prev => {
      const newPhotos = [...prev.photos];
      if (newPhotos[index]) {
        newPhotos[index] = { ...newPhotos[index], url };
      }
      return { ...prev, photos: newPhotos };
    });
  }, []);

  const removePhotoField = useCallback((index: number) => {
    setForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    if (!validateAllSteps(form)) {
      const allFields: (keyof FormType)[] = ['titre', 'description', 'categorie', 'ville'];
      setTouched(prev => {
        const next = { ...prev };
        allFields.forEach(f => { next[f] = true; });
        return next;
      });
      return;
    }

    setLoading(true);

    const payload = {
      titre: form.titre.trim(),
      description: form.description.trim(),
      categorie: form.categorie,
      sousCategorie: form.sousCategorie?.trim() || undefined,
      type: form.type,
      prix: {
        montant: form.estGratuit ? 0 : Number(form.montant) || 0,
        estNegociable: form.estNegociable,
        estGratuit: form.estGratuit
      },
      photos: form.photos.filter(p => p.url && p.url.trim() !== '').map(p => p.url),
      localisation: {
        pays: form.pays || 'Bénin',
        ville: form.ville.trim(),
        quartier: form.quartier?.trim() || '',
        details: form.details?.trim() || ''
      }
    };

    try {
      if (isEditMode) {
        await API.put(`/annonces/${annonceId}`, payload);
      } else {
        await API.post('/annonces', payload);
      }
      handleClose();
    } catch (err: any) {
      setGlobalError(err.response?.data?.message || "Erreur lors de l'enregistrement de l'annonce.");
      setLoading(false);
    }
  }, [form, validateAllSteps, handleClose, isEditMode, annonceId]);

  // Échap : quitte l'assistant (comportement conservé de la version modale)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleClose]);

  // Render step content (inline to avoid closure over hooks)
  const renderStepInfos = () => (
    <div className="space-y-6">
      <StepTitle
        icon={Sparkles}
        titre="Informations générales"
        aide="Décrivez clairement votre offre : c'est la première chose que verront les utilisateurs."
      />

      <TextInput
        name="titre"
        value={form.titre}
        onChange={handleChange}
        onBlur={() => handleBlur('titre')}
        placeholder="Ex: Électricien pro disponible pour dépannage"
        required
        error={errors.titre}
        touched={!!touched.titre}
        maxLength={100}
        helper="Donnez un titre clair et attractif"
      />

      <TextArea
        name="description"
        value={form.description}
        onChange={handleChange}
        onBlur={() => handleBlur('description')}
        placeholder="Décrivez votre service, tarifs, disponibilités..."
        required
        error={errors.description}
        touched={!!touched.description}
        maxLength={500}
        helper="Minimum 20 caractères. Décrivez ce que vous proposez en détail."
      />

      <CategorieTiles
        value={form.categorie}
        onSelect={(v) => handleSelect('categorie', v)}
        error={errors.categorie}
        touched={!!touched.categorie}
      />

      <TypeSegments
        value={form.type}
        onSelect={(v) => handleSelect('type', v)}
      />

      {form.categorie && (
        <div className="space-y-2 animate-fade-in">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Sous-catégorie <span className="text-slate-400 font-normal">(optionnel)</span>
          </label>
          <input
            name="sousCategorie"
            value={form.sousCategorie}
            onChange={handleChange}
            placeholder={`Ex: pour "${form.categorie}"...`}
            className="w-full px-4 py-3 bg-white/60 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
          />
        </div>
      )}

      {/* Tarification */}
      <div className="glass-light space-y-4 p-5 rounded-2xl">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Tarification</label>
        <div className="grid sm:grid-cols-2 gap-3">
          <ToggleSwitch
            checked={form.estGratuit}
            onChange={(checked) => {
              setForm(prev => ({
                ...prev,
                estGratuit: checked,
                estNegociable: checked ? false : prev.estNegociable,
                montant: checked ? '' : prev.montant
              }));
              setTouched(prev => ({ ...prev, montant: true }));
            }}
            label="Gratuit"
          />
          <ToggleSwitch
            checked={form.estNegociable}
            onChange={(checked) => setForm(prev => ({ ...prev, estNegociable: checked }))}
            label="Négociable"
            disabled={form.estGratuit}
          />
        </div>
        {!form.estGratuit && (
          <div className="relative animate-fade-in">
            <input
              type="text"
              inputMode="decimal"
              name="montant"
              value={form.montant}
              onChange={handleChange}
              onBlur={() => handleBlur('montant')}
              placeholder="0"
              className={`w-full px-4 py-3 bg-white/60 border rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all text-right pr-12 font-semibold ${
                errors.montant && touched.montant ? 'border-red-300 bg-red-50/60 ring-2 ring-red-100' : 'border-slate-200'
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">XOF</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderStepPhotos = () => {
    const filledCount = form.photos.filter(p => p.url && p.url.trim()).length;
    return (
      <div className="space-y-6">
        <StepTitle
          icon={Camera}
          titre="Photos de l'annonce"
          aide="Les annonces avec photos de qualité reçoivent davantage de contacts."
        />

        {/* Compteur en pilule + ajout d'un emplacement */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600 flex items-center gap-2 min-w-0">
            <span className="glass-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-slate-600 flex-shrink-0">
              <ImageIcon className="w-3.5 h-3.5 text-primary" />
              {filledCount}/6
            </span>
            <span className="hidden sm:inline text-slate-400">photos ajoutées</span>
          </p>
          {form.photos.length < 6 && (
            <button
              type="button"
              onClick={addPhotoField}
              className="btn-liquid-ghost rounded-full px-4 h-9 text-xs flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          )}
        </div>

        {/* Grille de vignettes : la première photo devient la couverture */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {form.photos.map((photo, idx) => {
            const remplie = !!(photo.url && photo.url.trim());
            return (
              <div
                key={photo.id}
                className={`relative group aspect-square rounded-2xl overflow-hidden transition-all duration-200 ${
                  remplie ? 'ring-1 ring-emerald-500/30' : ''
                }`}
              >
                <ImageUploader
                  currentImage={photo.url || ''}
                  onUpload={(url) => handlePhotoChange(idx, url)}
                />
                {idx === 0 && remplie && (
                  <div
                    className="absolute top-2 left-2 z-10 px-2 py-0.5 text-white text-[9px] font-bold rounded-full pointer-events-none"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    COUVERTURE
                  </div>
                )}
                {form.photos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePhotoField(idx)}
                    className="glass-control absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-200"
                    aria-label="Supprimer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
          {Array.from({ length: Math.max(0, 6 - form.photos.length) }).map((_, i) => (
            <div
              key={`placeholder-${i}`}
              className="aspect-square rounded-2xl border-2 border-dashed border-slate-200/70 flex items-center justify-center"
            >
              <ImageIcon className="w-7 h-7 text-slate-300/80" />
            </div>
          ))}
        </div>

        {/* Conseil */}
        <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            La première photo sera utilisée comme image principale de votre annonce.
            Des photos de qualité augmentent vos chances de contact.
          </p>
        </div>
      </div>
    );
  };

  const renderStepLocalisation = () => (
    <div className="space-y-6">
      <StepTitle
        icon={MapPin}
        titre="Localisation"
        aide="Où votre offre est-elle disponible ? Soyez précis pour être trouvé facilement."
      />

      <div className="glass-light p-5 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput
            name="pays"
            value={form.pays}
            onChange={handleChange}
            placeholder="Bénin"
            touched={!!touched.pays}
            helper="Pays où se trouve le service"
          />
          <TextInput
            name="ville"
            value={form.ville}
            onChange={handleChange}
            onBlur={() => handleBlur('ville')}
            placeholder="Cotonou"
            required
            error={errors.ville}
            touched={!!touched.ville}
            helper="Ville principale"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput
            name="quartier"
            value={form.quartier}
            onChange={handleChange}
            placeholder="Akpakpa"
            touched={!!touched.quartier}
            helper="Quartier précis"
          />
          <TextInput
            name="details"
            value={form.details}
            onChange={handleChange}
            placeholder="À côté de la pharmacie..."
            touched={!!touched.details}
            helper="Points de repère"
          />
        </div>
      </div>

      {/* Récapitulatif avant publication */}
      <div className="glass-light p-5 rounded-2xl space-y-3">
        <h4 className="text-sm font-bold text-slate-700">Récapitulatif</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Titre</span>
            <span className="text-slate-900 font-medium truncate max-w-[200px]">{form.titre || '—'}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Catégorie</span>
            <span className="flex items-center gap-1.5">
              {form.categorie && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: CATEGORIES.find(c => c.value === form.categorie)?.color }}
                />
              )}
              <span className="text-slate-900 font-medium">{form.categorie || '—'}</span>
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Type</span>
            <span className="text-slate-900 font-medium capitalize">{form.type}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Prix</span>
            <span className="text-slate-900 font-medium">
              {form.estGratuit ? 'Gratuit' : form.montant ? `${form.montant} XOF${form.estNegociable ? ' (négociable)' : ''}` : '—'}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Photos</span>
            <span className="text-slate-900 font-medium">{form.photos.filter(p => p.url && p.url.trim()).length} photo(s)</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Localisation</span>
            <span className="text-slate-900 font-medium truncate max-w-[200px]">
              {[form.ville, form.quartier].filter(Boolean).join(', ') || '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const stepComponents = [renderStepInfos, renderStepPhotos, renderStepLocalisation];

  return (
    <div className="w-full animate-fade-in">
      {/* ── En-tête de l'assistant : titre + stepper + progression ── */}
      <header className="glass-elevated rounded-[26px] px-5 sm:px-7 pt-5 sm:pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
              style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow-primary)' }}
            >
              {isEditMode ? <PenLine className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  {isEditMode ? "Modifier l'annonce" : 'Déposer une annonce'}
                </h1>
                {isEditMode && (
                  <span className="glass-pill inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-primary">
                    <PenLine className="w-3 h-3" /> Édition
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Trois étapes rapides pour mettre votre offre en ligne.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            title="Fermer (Échap)"
            aria-label="Fermer"
            className="glass-control w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <StepIndicator currentStep={currentStep} onStepClick={goToStep} />
      </header>

      {/* ── Corps : assistant (étapes) + aperçu en direct ── */}
      <div className="mt-5 lg:mt-6 grid lg:grid-cols-[minmax(0,1fr)_320px] gap-5 lg:gap-6 items-start">
        {/* Colonne principale */}
        <div className="min-w-0">
          {loadingAnnonce ? (
            <div className="glass-solid rounded-[26px] flex flex-col items-center justify-center gap-3 py-24">
              <Spinner size="lg" />
              <p className="text-sm text-slate-500">Chargement de votre annonce…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {globalError && (
                <div className="p-4 rounded-2xl border border-red-200 bg-red-50/80 text-sm text-red-600 flex items-center gap-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {globalError}
                </div>
              )}

              {/* Une seule étape visible à la fois, dans une carte dense
                  très lisible ; la transition relance à chaque changement */}
              <section key={currentStep} className="glass-solid rounded-[26px] p-5 sm:p-7 animate-slide-up">
                {stepComponents[currentStep]()}
              </section>

              {/* Navigation Précédent / Suivant */}
              <div className="flex items-center gap-3">
                {currentStep > 0 ? (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="btn-liquid-ghost rounded-full px-5 sm:px-6 h-12 text-sm flex-shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Retour
                  </button>
                ) : (
                  <p className="hidden sm:flex items-center gap-2 pl-1 text-xs text-slate-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    Vos informations restent privées jusqu'à la publication.
                  </p>
                )}

                {currentStep < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn-liquid-primary rounded-full flex-1 h-12 text-sm"
                  >
                    Continuer
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-liquid-primary rounded-full flex-1 h-13 sm:h-14 px-6 text-sm sm:text-base disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2.5">
                        <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Publication en cours…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-[18px] h-[18px]" />
                        {isEditMode ? 'Enregistrer les modifications' : "Publier l'annonce"}
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Aperçu repliable (mobile / tablette) — l'aperçu desktop est
                  dans le panneau latéral sticky ci-dessous */}
              <div className="lg:hidden glass rounded-3xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setApercuOuvert(o => !o)}
                  aria-expanded={apercuOuvert}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-slate-700">Aperçu en direct</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${apercuOuvert ? 'rotate-180' : ''}`} />
                </button>
                {apercuOuvert && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <PreviewAnnonce form={form} />
                    <p className="text-[11px] text-slate-400 text-center mt-3">
                      Ainsi apparaîtra votre annonce dans le fil et les résultats de recherche.
                    </p>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Panneau latéral d'aperçu (desktop, sticky) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Eye className="w-4 h-4 text-primary" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aperçu en direct</p>
            </div>
            <PreviewAnnonce form={form} />
            <p className="text-[11px] text-slate-400 text-center px-3">
              Ainsi apparaîtra votre annonce dans le fil et les résultats de recherche.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Deposer;
