import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Sparkles, MapPin, Check } from 'lucide-react';
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

  // Custom selects state
  const [openCategory, setOpenCategory] = useState(false);
  const [openType, setOpenType] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
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

  // Close modal with Escape + prevent body scroll
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
    options: CategoryOption[] | { value: string; label: string; color: string }[];
    onSelect: (value: string) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    refContainer: React.RefObject<HTMLDivElement>;
    placeholder?: string;
  }) => {
    const selected = options.find(opt => opt.value === value);

    return (
      <div className="space-y-2 relative" ref={refContainer}>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 text-left ${
            isOpen
              ? 'border-[#007AFF] bg-blue-50 ring-2 ring-blue-100'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="flex items-center gap-3">
            {selected && (
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: (selected as CategoryOption).color }}
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

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            <div className="max-h-56 overflow-y-auto py-1">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
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
          : 'border-slate-200 bg-white hover:border-slate-300'
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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/30"
      onClick={handleClose}
    >
      {/* Modal Card - slides up from bottom on mobile, centered on desktop */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[97vh] md:max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl md:rounded-3xl shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Header avec close */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#007AFF]">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Nouvelle annonce</h2>
              <p className="text-xs text-slate-400">Publiez en moins de 2 minutes</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="px-6 pb-6 pt-4 space-y-6">
          {/* Error message */}
          {error && (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Titre */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Titre *</label>
              <input
                name="titre"
                value={form.titre}
                onChange={handleChange}
                placeholder="Ex: Électricien pro disponible pour dépannage"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-100 transition-all"
                required
                maxLength={100}
              />
              <div className="text-right text-[10px] text-slate-400">{form.titre.length}/100</div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Décrivez votre service, tarifs, disponibilités..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                required
                maxLength={500}
              />
              <div className="text-right text-[10px] text-slate-400">{form.description.length}/500</div>
            </div>

            {/* Catégorie + Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomSelect
                label="Catégorie *"
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

            {/* Sous-catégorie (conditionnelle) */}
            {form.categorie && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Sous-catégorie <span className="text-slate-300">(optionnel)</span>
                </label>
                <input
                  name="sousCategorie"
                  value={form.sousCategorie}
                  onChange={handleChange}
                  placeholder={`Ex: pour "${form.categorie}"...`}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            )}

            {/* Prix */}
            <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Tarification</label>
              <div className="flex flex-wrap gap-3">
                <ToggleSwitch
                  checked={form.estGratuit}
                  onChange={(checked) => {
                    setForm(prev => ({
                      ...prev,
                      estGratuit: checked,
                      estNegociable: checked ? false : prev.estNegociable
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
                <div className="relative">
                  <input
                    type="number"
                    name="montant"
                    value={form.montant}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-100 transition-all text-right pr-12 font-semibold"
                    min="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">XOF</span>
                </div>
              )}
            </div>

            {/* Photos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Photos <span className="text-slate-300">({form.photos.filter(p => p.trim()).length}/6)</span>
                </label>
                {form.photos.length < 6 && (
                  <button
                    type="button"
                    onClick={addPhotoField}
                    className="text-xs font-medium text-[#007AFF] hover:text-blue-700 transition-colors"
                  >
                    + Ajouter
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {form.photos.map((photo, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
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
                        <MapPin className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <input
                      value={photo}
                      onChange={(e) => handlePhotoChange(i, e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    {form.photos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhotoField(i)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Supprimer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-slate-400">
                Utilisez des URLs d'images. L'upload direct sera ajouté prochainement.
              </p>
            </div>

            {/* Localisation */}
            <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-[#007AFF]" />
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Localisation</label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-medium text-slate-400">Pays</label>
                  <input
                    name="pays"
                    value={form.pays}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="Bénin"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-medium text-slate-400">Ville *</label>
                  <input
                    name="ville"
                    value={form.ville}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="Cotonou"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-medium text-slate-400">Quartier</label>
                  <input
                    name="quartier"
                    value={form.quartier}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="Akpakpa"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-medium text-slate-400">Points de repère</label>
                  <input
                    name="details"
                    value={form.details}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="À côté de la pharmacie..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#007AFF] text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Publier l'annonce
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ===== GLOBAL STYLES ===== */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .animate-slide-up {
            animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
        }
        /* Ensure modal content is scrollable */
        .overflow-y-auto {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
};

export default Deposer;