import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Plus, Minus, Sparkles, MapPin, Image as ImageIcon,
  ChevronDown, Check, Search, Upload, Trash2, Eye, EyeOff
} from 'lucide-react';
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
  icon?: React.ComponentType<{ className?: string }>;
}

// ===== DONNÉES =====
const CATEGORIES: CategoryOption[] = [
  { value: 'Électricité', label: 'Électricité', icon: () => <span className="text-amber-500">⚡</span> },
  { value: 'Plomberie', label: 'Plomberie', icon: () => <span className="text-blue-500">🔧</span> },
  { value: 'Maçonnerie', label: 'Maçonnerie', icon: () => <span className="text-orange-500">🧱</span> },
  { value: 'Peinture', label: 'Peinture', icon: () => <span className="text-purple-500">🎨</span> },
  { value: 'Menuiserie', label: 'Menuiserie', icon: () => <span className="text-amber-700">🪚</span> },
  { value: 'Couture', label: 'Couture', icon: () => <span className="text-pink-500">🧵</span> },
  { value: 'Coiffure', label: 'Coiffure', icon: () => <span className="text-violet-500">✂️</span> },
  { value: 'Esthétique', label: 'Esthétique', icon: () => <span className="text-rose-400">💄</span> },
  { value: 'Cours particuliers', label: 'Cours particuliers', icon: () => <span className="text-emerald-500">📚</span> },
  { value: 'Informatique', label: 'Informatique', icon: () => <span className="text-cyan-500">💻</span> },
  { value: 'Agriculture', label: 'Agriculture', icon: () => <span className="text-green-600">🌱</span> },
  { value: 'Vente de produits', label: 'Vente de produits', icon: () => <span className="text-red-500">🛒</span> },
  { value: 'Location', label: 'Location', icon: () => <span className="text-indigo-500">🔑</span> },
  { value: 'Transport', label: 'Transport', icon: () => <span className="text-blue-600">🚗</span> },
  { value: 'Autre', label: 'Autre', icon: () => <span className="text-slate-400">✨</span> },
];
const TYPES = [
  { value: 'service', label: 'Service', desc: 'Prestation, intervention, conseil' },
  { value: 'vente', label: 'Vente', desc: 'Produit neuf ou occasion' },
  { value: 'autre', label: 'Autre', desc: 'Échange, don, collaboration' },
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
    details: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // pour démo
  
  // Custom selects state
  const [openCategory, setOpenCategory] = useState(false);
  const [openType, setOpenType] = useState(false);
  const [searchCategory, setSearchCategory] = useState('');
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
      }    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close modal with Escape
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
    }  };

  const removePhotoField = (index: number) => {
    setForm(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const filteredCategories = CATEGORIES.filter(cat =>
    cat.label.toLowerCase().includes(searchCategory.toLowerCase())
  );

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
    searchValue,
    setSearchValue,
    refContainer,
    placeholder = 'Sélectionnez...',
    icon: Icon
  }: {
    label: string;
    value: string;
    options: CategoryOption[] | { value: string; label: string; desc?: string }[];
    onSelect: (value: string) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    searchValue?: string;
    setSearchValue?: (value: string) => void;
    refContainer: React.RefObject<HTMLDivElement>;
    placeholder?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }) => {
    const selected = options.find(opt => opt.value === value);
    
    return (
      <div className="space-y-2" ref={refContainer}>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all duration-300 text-left ${
            isOpen
              ? 'border-[#007AFF] bg-blue-500/10 ring-2 ring-blue-500/30'
              : 'border-slate-700/50 bg-slate-900/60 hover:border-slate-600'
          }`}
        >
          <span className="flex items-center gap-3">
            {Icon && selected && <Icon className="w-5 h-5 text-[#007AFF]" />}
            <span className={value ? 'text-white' : 'text-slate-500'}>
              {selected ? (selected as CategoryOption).label || (selected as any).label : placeholder}
            </span>
          </span>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 rounded-2xl border border-slate-700/50 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden animate-fade-in-scale">
            {/* Search */}
            {setSearchValue && (
              <div className="p-3 border-b border-slate-700/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20"
                    autoFocus
                  />
                </div>
              </div>
            )}
            
            {/* Options */}
            <div className="max-h-60 overflow-y-auto py-2">
              {filteredCategories.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-500 text-center">Aucun résultat</p>
              ) : (
                filteredCategories.map((opt) => {
                  const isSelected = opt.value === value;
                  const CategoryIcon = (opt as CategoryOption).icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onSelect(opt.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-blue-500/20 text-white'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      {CategoryIcon && <CategoryIcon className="w-5 h-5" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{opt.label}</p>
                        {(opt as any).desc && (
                          <p className="text-xs text-slate-500 truncate">{(opt as any).desc}</p>
                        )}
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-[#007AFF] shrink-0" />}
                    </button>
                  );
                })              )}
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
    <label className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
      disabled
        ? 'border-slate-800 bg-slate-900/30 opacity-50 cursor-not-allowed'
        : checked
          ? 'border-emerald-500/40 bg-emerald-500/10'
          : 'border-slate-700/50 bg-slate-900/60 hover:border-slate-600'
    }`}>
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <div className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${
        checked ? 'bg-[#007AFF]' : 'bg-slate-700'
      } ${disabled ? 'opacity-50' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
          checked ? 'left-6' : 'left-1'
        }`} />
      </div>
    </label>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"      aria-labelledby="modal-title"
    >
      {/* Backdrop blur overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-indigo-950/20 pointer-events-none" />
      
      {/* Modal Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900/95 via-slate-950/90 to-slate-900/95 backdrop-blur-2xl shadow-2xl shadow-black/60 animate-modal-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec close */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-slate-900/95 to-transparent backdrop-blur-md border-b border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#007AFF] to-indigo-600 shadow-lg shadow-blue-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-white">Nouvelle annonce</h2>
              <p className="text-xs text-slate-400">Publiez en moins de 2 minutes</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/50 text-slate-300 transition-all duration-300 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-400"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 pb-6 pt-4 space-y-6">
          
          {/* Error message */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-sm text-red-300 animate-fade-in">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Titre */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Titre de l'annonce *</label>
              <input                name="titre"
                value={form.titre}
                onChange={handleChange}
                placeholder="Ex: Électricien pro disponible pour dépannage urgent"
                className="w-full px-4 py-3.5 bg-slate-900/60 border border-slate-700/50 rounded-2xl text-sm text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-[#007AFF] focus:ring-4 focus:ring-blue-500/20"
                required
                maxLength={100}
              />
              <div className="flex justify-end text-[10px] text-slate-500">
                {form.titre.length}/100
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Description détaillée *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Décrivez votre service, vos tarifs, vos disponibilités, votre expérience..."
                className="w-full px-4 py-3.5 bg-slate-900/60 border border-slate-700/50 rounded-2xl text-sm text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-[#007AFF] focus:ring-4 focus:ring-blue-500/20 resize-none"
                required
                maxLength={500}
              />
              <div className="flex justify-end text-[10px] text-slate-500">
                {form.description.length}/500
              </div>
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
                searchValue={searchCategory}
                setSearchValue={setSearchCategory}
                refContainer={categoryRef}
                placeholder="Choisir une catégorie"
              />
              
              <div ref={typeRef}>
                <CustomSelect
                  label="Type d'annonce"
                  value={form.type}                  options={TYPES}
                  onSelect={(v) => handleSelect('type', v)}
                  isOpen={openType}
                  setIsOpen={setOpenType}
                  refContainer={typeRef}
                  placeholder="Type"
                />
              </div>
            </div>

            {/* Sous-catégorie */}
            {form.categorie && (
              <div className="space-y-2 animate-fade-in">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Sous-catégorie <span className="text-slate-600">(optionnel)</span>
                </label>
                <input
                  name="sousCategorie"
                  value={form.sousCategorie}
                  onChange={handleChange}
                  placeholder={`Ex: pour "${form.categorie}"...`}
                  className="w-full px-4 py-3.5 bg-slate-900/60 border border-slate-700/50 rounded-2xl text-sm text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-[#007AFF] focus:ring-4 focus:ring-blue-500/20"
                />
              </div>
            )}

            {/* Prix */}
            <div className="space-y-4 p-5 rounded-2xl border border-slate-700/50 bg-slate-900/40">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Tarification</label>
              
              <div className="flex flex-wrap gap-3">
                <ToggleSwitch
                  checked={form.estGratuit}
                  onChange={(checked) => {
                    setForm(prev => ({ ...prev, estGratuit: checked, estNegociable: checked ? false : prev.estNegociable }));
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
                    type="number"                    name="montant"
                    value={form.montant}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-4 py-3.5 bg-slate-900/60 border border-slate-700/50 rounded-2xl text-sm text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-[#007AFF] focus:ring-4 focus:ring-blue-500/20 text-right pr-16 font-semibold"
                    min="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">XOF</span>
                </div>
              )}
            </div>

            {/* Photos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Photos <span className="text-slate-600">({form.photos.filter(p => p.trim()).length}/6)</span>
                </label>
                {form.photos.length < 6 && (
                  <button
                    type="button"
                    onClick={addPhotoField}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#007AFF] hover:text-blue-400 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {form.photos.map((photo, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-700/50 bg-slate-900/40">
                    {/* Preview thumbnail */}
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center border border-slate-700/50">
                      {photo.trim() ? (
                        <>
                          <img
                            src={photo}
                            alt={`Preview ${i + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2364748b" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                        </>
                      ) : (                        <ImageIcon className="w-6 h-6 text-slate-600" />
                      )}
                    </div>
                    
                    <input
                      value={photo}
                      onChange={(e) => handlePhotoChange(i, e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-500/20"
                    />
                    
                    {form.photos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhotoField(i)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        aria-label="Supprimer la photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                <Upload className="w-3 h-3" />
                Pour le moment, utilisez des URLs d'images. L'upload direct sera ajouté prochainement.
              </p>
            </div>

            {/* Localisation */}
            <div className="space-y-4 p-5 rounded-2xl border border-slate-700/50 bg-slate-900/40">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-[#007AFF]" />
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Localisation</label>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-medium text-slate-500">Pays</label>
                  <input
                    name="pays"
                    value={form.pays}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Bénin"
                  />
                </div>
                <div className="space-y-2">                  <label className="block text-[10px] font-medium text-slate-500">Ville *</label>
                  <input
                    name="ville"
                    value={form.ville}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Cotonou"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-medium text-slate-500">Quartier</label>
                  <input
                    name="quartier"
                    value={form.quartier}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Akpakpa"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-medium text-slate-500">Points de repère</label>
                  <input
                    name="details"
                    value={form.details}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-500/20"
                    placeholder="À côté de la pharmacie..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#007AFF] to-indigo-600 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
            >
              <span className={`relative z-10 flex items-center justify-center gap-2 transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                <Sparkles className="w-4 h-4" />
                Publier l'annonce
              </span>
              
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>
          </form>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-950/95 to-transparent pointer-events-none" />
      </div>

      {/* ===== GLOBAL STYLES ===== */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .animate-modal-slide-up {
            animation: modalSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          @keyframes modalSlideUp {
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s ease-out forwards;
            opacity: 0;
          }
          @keyframes fadeIn { to { opacity: 1; } }
          .animate-fade-in-scale {
            animation: fadeInScale 0.2s cubic-bezier(0.23, 1, 0.32, 1) forwards;
            opacity: 0;
            transform: scale(0.98);
          }
          @keyframes fadeInScale { to { opacity: 1; transform: scale(1); } }
        }
      `}</style>
    </div>
  );
};

export default Deposer;