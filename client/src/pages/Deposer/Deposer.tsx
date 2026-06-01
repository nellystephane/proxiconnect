import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Sparkles, MapPin, Check, ChevronRight, ChevronLeft, Image as ImageIcon, AlertCircle } from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';
import API from '../../api/axios';


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
  photos: string[];
  pays: string;
  ville: string;
  quartier: string;
  details: string;
}

interface FormErrors {
  titre?: string;
  description?: string;
  categorie?: string;
  ville?: string;
  montant?: string;
  photos?: string;
}

interface CategoryOption {
  value: string;
  label: string;
  color: string;
}


// ===== DONNÉES =====
const CATEGORIES: CategoryOption[] = [
  { value: 'Électricité', label: 'Électricité', color: '#f59e0b' },
  { value: 'Plomberie', label: 'Plomberie', color: '#3b82f6' },
  { value: 'Maçonnerie', label: 'Maçonnerie', color: '#f97316' },
  { value: 'Peinture', label: 'Peinture', color: '#a855f7' },
  { value: 'Menuiserie', label: 'Menuiserie', color: '#d97706' },
  { value: 'Couture', label: 'Couture', color: '#ec4899' },
  { value: 'Coiffure', label: 'Coiffure', color: '#8b5cf6' },
  { value: 'Esthétique', label: 'Esthétique', color: '#f43f5e' },
  { value: 'Cours particuliers', label: 'Cours particuliers', color: '#10b981' },
  { value: 'Informatique', label: 'Informatique', color: '#06b6d4' },
  { value: 'Agriculture', label: 'Agriculture', color: '#22c55e' },
  { value: 'Vente de produits', label: 'Vente de produits', color: '#ef4444' },
  { value: 'Location', label: 'Location', color: '#6366f1' },
  { value: 'Transport', label: 'Transport', color: '#3b82f6' },
  { value: 'Autre', label: 'Autre', color: '#64748b' },
];

const TYPES = [
  { value: 'service', label: 'Service', color: '#3b82f6' },
  { value: 'vente', label: 'Vente', color: '#10b981' },
  { value: 'autre', label: 'Autre', color: '#64748b' },
];

const STEPS = [
  { id: 'infos', label: 'Infos', icon: Sparkles },
  { id: 'photos', label: 'Photos', icon: ImageIcon },
  { id: 'localisation', label: 'Localisation', icon: MapPin },
];

interface DeposerProps {
  onClose?: () => void;
}


const Deposer: React.FC<DeposerProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ===== STATE =====
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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

  // Custom selects state
  const [openCategory, setOpenCategory] = useState(false);
  const [openType, setOpenType] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);


  // ===== VALIDATION =====
  const validateField = useCallback((name: keyof FormType, value: any): string | undefined => {
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
        if (!form.estGratuit && value && value !== '') {
          const num = Number(value);
          if (isNaN(num) || num < 0) return 'Le montant doit être un nombre positif';
        }
        return undefined;
      default:
        return undefined;
    }
  }, [form.estGratuit]);

  const validateStep = useCallback((stepIndex: number): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (stepIndex === 0) {
      const titreError = validateField('titre', form.titre);
      if (titreError) {
        newErrors.titre = titreError;
        isValid = false;
      }
      
      const descriptionError = validateField('description', form.description);
      if (descriptionError) {
        newErrors.description = descriptionError;
        isValid = false;
      }
      
      const categorieError = validateField('categorie', form.categorie);
      if (categorieError) {
        newErrors.categorie = categorieError;
        isValid = false;
      }
      
      const villeError = validateField('ville', form.ville);
      if (villeError) {
        newErrors.ville = villeError;
        isValid = false;
      }
    }
    
    if (stepIndex === 2) {
      const villeError = validateField('ville', form.ville);
      if (villeError) {
        newErrors.ville = villeError;
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  }, [form, validateField]);


  // ===== EFFETS =====
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setOpenCategory(false);
      }
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) {
        setOpenType(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, []);

  // Validation en temps réel
  useEffect(() => {
    const newErrors: FormErrors = {};
    const fieldsToValidate = ['titre', 'description', 'categorie', 'ville', 'montant'] as const;
    
    fieldsToValidate.forEach(field => {
      if (touched[field]) {
        const error = validateField(field, form[field]);
        if (error) {
          newErrors[field] = error;
        }
      }
    });
    
    setErrors(prev => ({ ...prev, ...newErrors }));
  }, [form.titre, form.description, form.categorie, form.ville, form.montant, touched, validateField]);


  // ===== HANDLERS =====
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) {
        onClose();
      } else {
        navigate(-1);
      }
    }, 300);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm(prev => ({ ...prev, [name]: val }));
    setTouched(prev => ({ ...prev, [name]: true }));
    setGlobalError('');
  };

  const handleSelect = (field: 'categorie' | 'type', value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'categorie') setOpenCategory(false);
    if (field === 'type') setOpenType(false);
    setGlobalError('');
  };

  const handleBlur = (name: keyof FormType) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex > currentStep) {
      if (!validateStep(currentStep)) {
        const stepFields: Record<number, string[]> = {
          0: ['titre', 'description', 'categorie', 'ville'],
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
      setDirection('next');
    } else {
      setDirection('prev');
    }
    setCurrentStep(stepIndex);
    setGlobalError('');
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const handlePhotoChange = (index: number, value: string) => {
    const newPhotos = [...form.photos];
    newPhotos[index] = value;
    setForm(prev => ({ ...prev, photos: newPhotos }));
  };

  const addPhotoField = () => {
    if (form.photos.length < 6) {
      setForm(prev => ({ ...prev, photos: [...prev.photos, ''] }));
    }
  };

  const removePhotoField = (index: number) => {
    setForm(prev => ({ 
      ...prev, 
      photos: prev.photos.filter((_, i) => i !== index) 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    setLoading(true);

    // Valider toutes les étapes
    let allValid = true;
    for (let i = 0; i <= currentStep; i++) {
      if (!validateStep(i)) {
        allValid = false;
        break;
      }
    }
    
    if (!allValid) {
      const allFields = ['titre', 'description', 'categorie', 'ville'];
      setTouched(prev => {
        const next = { ...prev };
        allFields.forEach(f => { next[f] = true; });
        return next;
      });
      setLoading(false);
      return;
    }

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
      photos: form.photos.filter(p => p && p.trim() !== ''),
      localisation: {
        pays: form.pays || 'Bénin',
        ville: form.ville.trim(),
        quartier: form.quartier?.trim() || '',
        details: form.details?.trim() || ''
      }
    };

    try {
      await API.post('/annonces', payload);
      handleClose();
    } catch (err: any) {
      setGlobalError(err.response?.data?.message || "Erreur lors de la création de l'annonce.");
      setLoading(false);
    }
  };


  // ===== SOUS-COMPOSANTS =====

  const StepIndicator = () => (
    <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/60 px-6 py-4">
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => goToStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-[#007AFF] text-white shadow-lg shadow-blue-200'
                    : isCompleted
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                }`}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-xs font-semibold hidden sm:inline ${
                  isActive ? 'text-white' : isCompleted ? 'text-emerald-700' : 'text-slate-500'
                }`}>
                  {step.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 transition-colors duration-300 ${
                  isCompleted ? 'bg-emerald-400' : 'bg-slate-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#007AFF] transition-all duration-500 ease-out rounded-full"
          style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );

  const ErrorMessage = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
      <div className="flex items-center gap-1.5 mt-1.5 animate-fade-in">
        <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
        <span className="text-xs text-red-500 font-medium">{error}</span>
      </div>
    );
  };

  const FieldWrapper = ({
    children,
    label,
    required,
    error,
    name,
    helper,
  }: {
    children: React.ReactNode;
    label: string;
    required?: boolean;
    error?: string;
    name: keyof FormType;
    helper?: string;
  }) => {
    const hasError = !!error && touched[name];
    return (
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
        {hasError && <ErrorMessage error={error} />}
        {helper && !hasError && <span className="text-[10px] text-slate-400">{helper}</span>}
      </div>
    );
  };

  const CustomSelect = ({
    label,
    value,
    options,
    onSelect,
    isOpen,
    setIsOpen,
    refContainer,
    placeholder = 'Sélectionnez...',
    required,
    error,
    name,
  }: {
    label: string;
    value: string;
    options: CategoryOption[];
    onSelect: (value: string) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    refContainer: React.RefObject<HTMLDivElement>;
    placeholder?: string;
    required?: boolean;
    error?: string;
    name: keyof FormType;
  }) => {
    const selected = options.find(opt => opt.value === value);
    const hasError = !!error && touched[name];

    return (
      <div className="space-y-2 relative" ref={refContainer}>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 text-left ${
            hasError
              ? 'border-red-300 bg-red-50 ring-2 ring-red-100'
              : isOpen
                ? 'border-[#007AFF] bg-blue-50 ring-2 ring-blue-100'
                : value
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-slate-200 bg-white/80 backdrop-blur-sm hover:border-slate-300'
          }`}
        >
          <span className="flex items-center gap-3">
            {selected && (
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selected.color }}
              />
            )}
            <span className={value ? 'text-slate-900 font-medium' : 'text-slate-400'}>
              {selected ? selected.label : placeholder}
            </span>
          </span>
          <span className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {isOpen && (
          <div
            className="absolute z-50 w-full mt-2 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
            role="listbox"
          >
            <div className="max-h-56 overflow-y-auto py-1">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => onSelect(opt.value)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-[#007AFF]'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className="flex-1 text-sm font-medium">{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#007AFF] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {hasError && <ErrorMessage error={error} />}
      </div>
    );
  };

  const ToggleSwitch = ({
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
    <label className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
      disabled
        ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
        : checked
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-slate-200 bg-white/80 backdrop-blur-sm hover:border-slate-300'
    }`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        checked ? 'bg-[#007AFF]' : 'bg-slate-200'
      } ${disabled ? 'opacity-50' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'left-5' : 'left-0.5'
        }`} />
      </div>
    </label>
  );

  const TextInput = ({
    name,
    value,
    onChange,
    onBlur,
    placeholder,
    required,
    error,
    type = 'text',
    maxLength,
    suffix,
    helper,
  }: {
    name: keyof FormType;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: () => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
    type?: string;
    maxLength?: number;
    suffix?: string;
    helper?: string;
  }) => {
    const hasError = !!error && touched[name];
    const isValid = !hasError && touched[name] && value && value.trim().length > 0;

    return (
      <FieldWrapper label={name.charAt(0).toUpperCase() + name.slice(1)} required={required} error={error} name={name} helper={helper}>
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
            className={`w-full px-4 py-3 bg-white/80 border rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${
              hasError
                ? 'border-red-300 bg-red-50 ring-2 ring-red-100 focus:border-red-400 focus:ring-red-200'
                : isValid
                  ? 'border-emerald-200 bg-emerald-50/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
                  : 'border-slate-200 focus:border-[#007AFF] focus:ring-2 focus:ring-blue-100'
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
  };

  const TextArea = ({
    name,
    value,
    onChange,
    onBlur,
    placeholder,
    required,
    error,
    rows = 4,
    maxLength,
    helper,
  }: {
    name: keyof FormType;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onBlur?: () => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
    rows?: number;
    maxLength?: number;
    helper?: string;
  }) => {
    const hasError = !!error && touched[name];
    const isValid = !hasError && touched[name] && value && value.trim().length >= 20;

    return (
      <FieldWrapper label={name.charAt(0).toUpperCase() + name.slice(1)} required={required} error={error} name={name} helper={helper}>
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
            className={`w-full px-4 py-3 bg-white/80 border rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all resize-none ${
              hasError
                ? 'border-red-300 bg-red-50 ring-2 ring-red-100 focus:border-red-400 focus:ring-red-200'
                : isValid
                  ? 'border-emerald-200 bg-emerald-50/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
                  : 'border-slate-200 focus:border-[#007AFF] focus:ring-2 focus:ring-blue-100'
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
  };

  const renderStepInfos = () => (
    <div className="space-y-5 animate-step-in">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-[#007AFF]" />
        <h3 className="text-base font-semibold text-slate-800">Informations générales</h3>
      </div>

      <TextInput
        name="titre"
        value={form.titre}
        onChange={handleChange}
        onBlur={() => handleBlur('titre')}
        placeholder="Ex: Électricien pro disponible pour dépannage"
        required
        error={errors.titre}
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
        maxLength={500}
        helper="Minimum 20 caractères. Décrivez ce que vous proposez en détail."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CustomSelect
          label="Catégorie"
          value={form.categorie}
          options={CATEGORIES}
          onSelect={(v) => handleSelect('categorie', v)}
          isOpen={openCategory}
          setIsOpen={setOpenCategory}
          refContainer={categoryRef}
          placeholder="Choisir une catégorie"
          required
          error={errors.categorie}
          name="categorie"
        />
        <CustomSelect
          label="Type"
          value={form.type}
          options={TYPES}
          onSelect={(v) => handleSelect('type', v)}
          isOpen={openType}
          setIsOpen={setOpenType}
          refContainer={typeRef}
          placeholder="Type d'annonce"
          name="type"
        />
      </div>

      {form.categorie && (
        <div className="space-y-2 animate-fade-in">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Sous-catégorie <span className="text-slate-300 font-normal">(optionnel)</span>
          </label>
          <input
            name="sousCategorie"
            value={form.sousCategorie}
            onChange={handleChange}
            placeholder={`Ex: pour "${form.categorie}"...`}
            className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
      )}

      <div className="space-y-4 p-5 rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-sm">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Tarification</label>
        <div className="flex flex-wrap gap-3">
          <ToggleSwitch
            checked={form.estGratuit}
            onChange={(checked) => {
              setForm(prev => ({
                ...prev,
                estGratuit: checked,
                estNegociable: checked ? false : prev.estNegociable,
                montant: checked ? '' : prev.montant
              }));
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
              type="number"
              name="montant"
              value={form.montant}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-100 transition-all text-right pr-12 font-semibold"
              min="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">XOF</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderStepPhotos = () => {
    const filledCount = form.photos.filter(p => p && p.trim()).length;
    return (
      <div className="space-y-5 animate-step-in">
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon className="w-4 h-4 text-[#007AFF]" />
          <h3 className="text-base font-semibold text-slate-800">Photos</h3>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Ajoutez des photos pour illustrer votre annonce
            <span className="text-slate-400 ml-1">({filledCount}/6)</span>
          </p>
          {form.photos.length < 6 && (
            <button
              type="button"
              onClick={addPhotoField}
              className="flex items-center gap-1 text-xs font-medium text-[#007AFF] hover:text-blue-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {form.photos.map((photo, i) => (
            <div
              key={i}
              className={`relative group rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden ${
                photo && photo.trim()
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-slate-200 bg-white/50 hover:border-[#007AFF] hover:bg-blue-50/30'
              }`}
            >
              <div className="aspect-square">
                <ImageUploader
                  currentImage={photo || ''}
                  onUpload={(url) => handlePhotoChange(i, url)}
                />
              </div>
              {i === 0 && photo && photo.trim() && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#007AFF] text-white text-[10px] font-bold rounded-full">
                  COVER
                </div>
              )}
              {form.photos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePhotoField(i)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
                  aria-label="Supprimer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 6 - form.photos.length) }).map((_, i) => (
            <div
              key={`placeholder-${i}`}
              className="aspect-square rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 flex items-center justify-center"
            >
              <ImageIcon className="w-8 h-8 text-slate-300" />
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            La première photo sera utilisée comme image principale de votre annonce.
            Des photos de qualité augmentent vos chances de contact de 3x.
          </p>
        </div>
      </div>
    );
  };

  const renderStepLocalisation = () => (
    <div className="space-y-5 animate-step-in">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-4 h-4 text-[#007AFF]" />
        <h3 className="text-base font-semibold text-slate-800">Localisation</h3>
      </div>

      <div className="p-5 rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput
            name="pays"
            value={form.pays}
            onChange={handleChange}
            placeholder="Bénin"
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
            helper="Ville principale"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput
            name="quartier"
            value={form.quartier}
            onChange={handleChange}
            placeholder="Akpakpa"
            helper="Quartier précis"
          />
          <TextInput
            name="details"
            value={form.details}
            onChange={handleChange}
            placeholder="À côté de la pharmacie..."
            helper="Points de repère"
          />
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-slate-200/60 bg-slate-50/50 backdrop-blur-sm space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">Récapitulatif</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Titre</span>
            <span className="text-slate-900 font-medium truncate max-w-[200px]">{form.titre || '—'}</span>
          </div>
          <div className="flex justify-between">
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
          <div className="flex justify-between">
            <span className="text-slate-500">Type</span>
            <span className="text-slate-900 font-medium capitalize">{form.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Prix</span>
            <span className="text-slate-900 font-medium">
              {form.estGratuit ? 'Gratuit' : form.montant ? `${form.montant} XOF${form.estNegociable ? ' (négociable)' : ''}` : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Photos</span>
            <span className="text-slate-900 font-medium">{form.photos.filter(p => p && p.trim()).length} photo(s)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Localisation</span>
            <span className="text-slate-900 font-medium truncate max-w-[200px]">
              {[form.ville, form.quartier].filter(Boolean).join(', ') || '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );


  // ===== RENDU PRINCIPAL =====

  const stepComponents = [renderStepInfos, renderStepPhotos, renderStepLocalisation];

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className={`relative w-full max-w-2xl h-dvh md:h-auto md:max-h-[90vh] overflow-hidden glass rounded-t-3xl md:rounded-3xl shadow-2xl transition-all duration-300 ${
          isClosing ? 'translate-y-8 scale-[0.98] opacity-0' : 'translate-y-0 scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain' }}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm hover:bg-white transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-slate-700" />
        </button>

        <StepIndicator />

        <div
          ref={contentRef}
          className="px-6 pb-6 pt-4 overflow-y-auto"
          style={{ maxHeight: 'calc(90vh - 120px)', overscrollBehavior: 'contain' }}
        >
          {globalError && (
            <div className="mb-4 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600 flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {stepComponents[currentStep]()}

            <div className="flex items-center gap-3 pt-4 border-t border-slate-200/60">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Retour
                </button>
              )}

              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-[#007AFF] text-white rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200/50"
                >
                  Continuer
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-[#007AFF] text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Publier l'annonce
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.6);
        }
        @media (prefers-reduced-motion: no-preference) {
          .animate-fade-in {
            animation: fadeIn 0.2s ease-out forwards;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-step-in {
            animation: stepIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes stepIn {
            from { opacity: 0; transform: translateX(${direction === 'next' ? '20px' : '-20px'}); }
            to { opacity: 1; transform: translateX(0); }
          }
        }
        .overflow-y-auto {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
};


export default Deposer;