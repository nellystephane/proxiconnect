import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Sparkles, MapPin, Check, ChevronRight, Image as ImageIcon, AlertCircle } from 'lucide-react';
import API from '../../api/axios.ts';

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

interface CategoryOption {
  value: string;
  label: string;
  color: string;
  icon?: string;
}

// ===== DONNÉES =====
const CATEGORIES: CategoryOption[] = [
  { value: 'Électricité', label: 'Électricité', color: '#0EA5E9', icon: '⚡' },
  { value: 'Plomberie', label: 'Plomberie', color: '#06B6D4', icon: '🔧' },
  { value: 'Maçonnerie', label: 'Maçonnerie', color: '#0284C7', icon: '🧱' },
  { value: 'Peinture', label: 'Peinture', color: '#7C3AED', icon: '🎨' },
  { value: 'Menuiserie', label: 'Menuiserie', color: '#D97706', icon: '🪵' },
  { value: 'Couture', label: 'Couture', color: '#EC4899', icon: '🧵' },
  { value: 'Coiffure', label: 'Coiffure', color: '#A855F7', icon: '✂️' },
  { value: 'Esthétique', label: 'Esthétique', color: '#F43F5E', icon: '💅' },
  { value: 'Cours particuliers', label: 'Cours particuliers', color: '#10B981', icon: '📚' },
  { value: 'Informatique', label: 'Informatique', color: '#06B6D4', icon: '💻' },
  { value: 'Agriculture', label: 'Agriculture', color: '#22C55E', icon: '🌾' },
  { value: 'Vente de produits', label: 'Vente de produits', color: '#EF4444', icon: '🛍️' },
  { value: 'Location', label: 'Location', color: '#6366F1', icon: '🏠' },
  { value: 'Transport', label: 'Transport', color: '#3B82F6', icon: '🚗' },
  { value: 'Autre', label: 'Autre', color: '#64748B', icon: '⭐' },
];

const TYPES = [
  { value: 'service', label: 'Service', color: '#3B82F6', icon: '🔧' },
  { value: 'vente', label: 'Vente', color: '#10B981', icon: '📦' },
  { value: 'autre', label: 'Autre', color: '#64748B', icon: '❓' },
];

interface DeposerProps {
  onClose?: () => void;
}

const Deposer: React.FC<DeposerProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormType>({
    titre: '',
    description: '',
    categorie: '',
    sousCategorie: '',
    type: 'service',
    montant: '',
    estNegociable: false,
    estGratuit: false,
    photos: [''],
    pays: 'Bénin',
    ville: '',
    quartier: '',
    details: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [completionPercent, setCompletionPercent] = useState(0);

  // Custom selects state
  const [openCategory, setOpenCategory] = useState(false);
  const [openType, setOpenType] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  // Calculate completion percentage
  useEffect(() => {
    const filledFields = [
      form.titre,
      form.description,
      form.categorie,
      form.ville,
      form.photos.some(p => p.trim())
    ].filter(Boolean).length;
    setCompletionPercent((filledFields / 5) * 100);
  }, [form]);

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

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm(prev => ({ ...prev, [name]: val }));
    if (error) setError('');
  };

  const handleSelect = (field: 'categorie' | 'type', value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'categorie') setOpenCategory(false);
    if (field === 'type') setOpenType(false);
    if (error) setError('');
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
    setForm(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.titre || !form.description || !form.categorie || !form.ville) {
      setError('Titre, description, catégorie et ville sont obligatoires.');
      return;
    }

    const payload = {
      titre: form.titre,
      description: form.description,
      categorie: form.categorie,
      sousCategorie: form.sousCategorie || undefined,
      type: form.type,
      prix: {
        montant: form.estGratuit ? 0 : Number(form.montant) || 0,
        estNegociable: form.estNegociable,
        estGratuit: form.estGratuit
      },
      photos: form.photos.filter(p => p.trim() !== ''),
      localisation: {
        pays: form.pays || 'Bénin',
        ville: form.ville,
        quartier: form.quartier || '',
        details: form.details || ''
      }
    };

    setLoading(true);
    try {
      await API.post('/annonces', payload);
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la création de l'annonce.");
    } finally {
      setLoading(false);
    }
  };

  // ===== COMPONENTS =====

  const CustomSelect = ({
    label,
    value,
    options,
    onSelect,
    isOpen,
    setIsOpen,
    refContainer,
    placeholder = 'Sélectionnez...',
  }: {
    label: string;
    value: string;
    options: CategoryOption[] | { value: string; label: string; color: string; icon?: string }[];
    onSelect: (value: string) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    refContainer: React.RefObject<HTMLDivElement>;
    placeholder?: string;
  }) => {
    const selected = options.find(opt => opt.value === value);

    return (
      <div className="space-y-2.5 relative" ref={refContainer}>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-lg border-2 transition-all duration-300 text-left group ${
            isOpen
              ? 'border-blue-400 bg-blue-50/50 shadow-lg shadow-blue-100/40'
              : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-md hover:shadow-blue-50/30'
          }`}
        >
          <span className="flex items-center gap-3">
            {selected && (
              <span className="text-lg">
                {(selected as CategoryOption).icon || '•'}
              </span>
            )}
            <span className={`transition-colors duration-300 ${
              value ? 'text-slate-900 font-semibold' : 'text-slate-400 font-medium'
            }`}>
              {selected ? selected.label : placeholder}
            </span>
          </span>
          <svg 
            className={`w-5 h-5 text-slate-400 transition-transform duration-300 group-hover:text-blue-400 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 rounded-lg border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="max-h-56 overflow-y-auto py-1">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSelect(opt.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-100 text-blue-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl">
                      {(opt as CategoryOption).icon || '•'}
                    </span>
                    <span className="flex-1 text-sm font-medium">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-5 h-5 text-blue-600 flex-shrink-0 animate-bounce" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
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
    <label className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all duration-300 cursor-pointer group ${
      disabled
        ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
        : checked
          ? 'border-blue-300 bg-blue-50'
          : 'border-slate-200 bg-white hover:border-blue-200'
    }`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className={`relative w-12 h-6.5 rounded-full transition-all duration-300 ${
        checked ? 'bg-blue-500 shadow-lg shadow-blue-200' : 'bg-slate-200'
      } ${disabled ? 'opacity-50' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-0.5'
        }`} />
      </div>
    </label>
  );

  const SectionHeader = ({ icon: Icon, title, step }: { icon: React.ReactNode; title: string; step: number }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600">
        {Icon}
      </div>
      <div>
        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Étape {step}</div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/20 backdrop-blur-md"
      onClick={handleClose}
    >
      {/* Modal avec gradient subtil */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl h-dvh md:h-auto md:max-h-[90vh] overflow-y-auto rounded-t-3xl md:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 duration-500"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          overscrollBehavior: 'contain',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="fixed top-4 right-4 z-50 h-10 w-10 rounded-full bg-white/95 shadow-lg hover:shadow-2xl hover:bg-blue-50 transition-all duration-300 flex items-center justify-center group"
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
        </button>

        {/* Progress Bar */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Création d'annonce</h2>
            <span className="text-xs font-semibold text-blue-600">{Math.round(completionPercent)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 rounded-full shadow-lg shadow-blue-300/50"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Contenu */}
        <div className="px-6 pb-8 pt-6 space-y-8">
          {error && (
            <div className="p-4 rounded-lg border-2 border-red-200 bg-red-50/80 text-sm text-red-700 flex items-center gap-3 animate-in fade-in duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1 : Infos générales */}
            <div className="space-y-5">
              <SectionHeader icon={<Sparkles className="w-5 h-5" />} title="Détails de l'annonce" step={1} />

              {/* Titre */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  name="titre"
                  value={form.titre}
                  onChange={handleChange}
                  placeholder="Électricien expérimenté - Dépannage rapide et fiable"
                  className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                  required
                  maxLength={100}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500">Soyez précis et attractif</p>
                  <span className="text-xs font-semibold text-slate-400">{form.titre.length}/100</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Décrivez en détail votre service, votre expérience, vos horaires, tarifs spéciaux..."
                  className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-300 resize-none"
                  required
                  maxLength={500}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500">Plus de détails = plus de clients</p>
                  <span className="text-xs font-semibold text-slate-400">{form.description.length}/500</span>
                </div>
              </div>

              {/* Catégorie & Type */}
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
                />
              </div>

              {/* Sous-catégorie */}
              {form.categorie && (
                <div className="space-y-2.5 animate-in fade-in duration-300">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Précision <span className="text-slate-400">(optionnel)</span>
                  </label>
                  <input
                    name="sousCategorie"
                    value={form.sousCategorie}
                    onChange={handleChange}
                    placeholder={`Ex: pour "${form.categorie}"...`}
                    className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                  />
                </div>
              )}

              {/* Tarification */}
              <div className="space-y-4 p-5 rounded-lg border-2 border-slate-200 bg-gradient-to-br from-blue-50 to-cyan-50/30">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Tarification
                </label>
                <div className="space-y-3">
                  <ToggleSwitch
                    checked={form.estGratuit}
                    onChange={(checked) => {
                      setForm(prev => ({
                        ...prev,
                        estGratuit: checked,
                        estNegociable: checked ? false : prev.estNegociable
                      }));
                    }}
                    label="Service gratuit"
                  />
                  <ToggleSwitch
                    checked={form.estNegociable}
                    onChange={(checked) => setForm(prev => ({ ...prev, estNegociable: checked }))}
                    label="Prix négociable"
                    disabled={form.estGratuit}
                  />
                </div>
                {!form.estGratuit && (
                  <div className="relative mt-4 pt-4 border-t border-slate-200">
                    <input
                      type="number"
                      name="montant"
                      value={form.montant}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-right text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-300 font-bold text-lg"
                      min="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-semibold">XOF</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2 : Photos */}
            <div className="space-y-5">
              <SectionHeader icon={<ImageIcon className="w-5 h-5" />} title="Galerie photos" step={2} />
              <p className="text-sm text-slate-600">Les photos augmentent vos chances de réussite de 80%</p>

              <div className="space-y-3">
                {form.photos.map((photo, i) => (
                  <div key={i} className="group flex items-center gap-3 p-4 rounded-lg border-2 border-slate-200 bg-white hover:border-blue-200 hover:shadow-md transition-all duration-300">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border-2 border-slate-200 flex-shrink-0">
                      {photo.trim() ? (
                        <img
                          src={photo}
                          alt={`Preview ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <input
                      type="text"
                      value={photo}
                      onChange={(e) => handlePhotoChange(i, e.target.value)}
                      placeholder="Collez l'URL de votre photo"
                      className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                    />
                    {form.photos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhotoField(i)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100"
                        aria-label="Supprimer"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-slate-600">
                  <span className="text-blue-600">{form.photos.filter(p => p.trim()).length}</span>/6 photos
                </span>
                {form.photos.length < 6 && (
                  <button
                    type="button"
                    onClick={addPhotoField}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une photo
                  </button>
                )}
              </div>
            </div>

            {/* Section 3 : Localisation */}
            <div className="space-y-5">
              <SectionHeader icon={<MapPin className="w-5 h-5" />} title="Localisation" step={3} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Pays <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.pays}
                    disabled
                    className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-sm text-slate-600 font-semibold opacity-75 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Ville <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="ville"
                    value={form.ville}
                    onChange={handleChange}
                    placeholder="Cotonou, Porto-Novo..."
                    className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Quartier <span className="text-slate-400">(optionnel)</span>
                </label>
                <input
                  type="text"
                  name="quartier"
                  value={form.quartier}
                  onChange={handleChange}
                  placeholder="Fidjrossè, Menontin..."
                  className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                />
              </div>

              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Détails <span className="text-slate-400">(optionnel)</span>
                </label>
                <textarea
                  name="details"
                  value={form.details}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Détails supplémentaires sur la localisation..."
                  className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-300 resize-none"
                />
              </div>
            </div>

            {/* Bouton Submit */}
            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3.5 rounded-lg border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold hover:shadow-lg hover:shadow-blue-300/50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Publier l'annonce
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-from-bottom {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-in {
          animation: slide-in-from-bottom 0.5s ease-out;
        }

        .animate-in.fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-bounce {
          animation: bounce 0.6s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default Deposer;
