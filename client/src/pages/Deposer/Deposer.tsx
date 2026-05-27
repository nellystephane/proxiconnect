import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Trash2, Sparkles, MapPin, Check, ChevronRight, Image as ImageIcon, AlertCircle } from 'lucide-react';
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
    required = false,
  }: {
    label: string;
    value: string;
    options: CategoryOption[] | { value: string; label: string; color: string }[];
    onSelect: (value: string) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    refContainer: React.RefObject<HTMLDivElement>;
    placeholder?: string;
    required?: boolean;
  }) => {
    const selected = options.find(opt => opt.value === value);

    return (
      <div className="space-y-2.5 relative" ref={refContainer}>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-colors duration-200 text-left group ${
            isOpen
              ? 'border-slate-300 bg-slate-50/50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="flex items-center gap-3">
            {selected && (
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: (selected as CategoryOption).color }}
              />
            )}
            <span className={`transition-colors duration-200 ${
              value ? 'text-slate-900 font-semibold' : 'text-slate-400 font-medium'
            }`}>
              {selected ? selected.label : placeholder}
            </span>
          </span>
          <svg 
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
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
          <div className="absolute z-50 w-full mt-1 rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden">
            <div className="max-h-56 overflow-y-auto py-1">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSelect(opt.value)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 ${
                      isSelected
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className="flex-1 text-sm font-medium">{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-slate-700 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) => (
    <div className="flex items-start gap-3 mb-6">
      <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600 flex-shrink-0">
        {Icon}
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/20 backdrop-blur-md"
      onClick={handleClose}
    >
      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl h-dvh md:h-auto md:max-h-[90vh] overflow-y-auto rounded-t-3xl md:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          overscrollBehavior: 'contain',
          background: '#ffffff'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="fixed top-4 right-4 z-50 h-10 w-10 rounded-full bg-white shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all duration-200 flex items-center justify-center"
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>

        {/* Progress Bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-slate-100 px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Créer une annonce</h2>
            <span className="text-xs font-semibold text-slate-500">{Math.round(completionPercent)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-slate-900 transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Contenu */}
        <div className="px-6 pb-8 pt-6 space-y-8">
          {error && (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1 : Infos générales */}
            <div className="space-y-5">
              <SectionHeader 
                icon={<Sparkles className="w-5 h-5" />} 
                title="Détails de l'annonce"
                subtitle="Soyez précis et attractif pour attirer plus de clients"
              />

              {/* Titre */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  name="titre"
                  value={form.titre}
                  onChange={handleChange}
                  placeholder="Électricien expérimenté - Dépannage rapide"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all duration-200"
                  required
                  maxLength={100}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500"></p>
                  <span className="text-xs font-medium text-slate-400">{form.titre.length}/100</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Décrivez votre service, votre expérience, vos horaires, tarifs spéciaux..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all duration-200 resize-none"
                  required
                  maxLength={500}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500"></p>
                  <span className="text-xs font-medium text-slate-400">{form.description.length}/500</span>
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
                  required={true}
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
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Spécialisation <span className="text-slate-400 font-normal">(optionnel)</span>
                  </label>
                  <input
                    name="sousCategorie"
                    value={form.sousCategorie}
                    onChange={handleChange}
                    placeholder={`Précisez votre domaine...`}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all duration-200"
                  />
                </div>
              )}

              {/* Tarification */}
              <div className="space-y-4 p-5 rounded-lg border border-slate-200 bg-slate-50/40">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Tarification
                </label>
                
                <div className="space-y-3">
                  {/* Option Gratuit */}
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 cursor-pointer transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={form.estGratuit}
                      onChange={(e) => {
                        setForm(prev => ({
                          ...prev,
                          estGratuit: e.target.checked,
                          estNegociable: e.target.checked ? false : prev.estNegociable
                        }));
                      }}
                      className="w-5 h-5 text-slate-900 rounded border-slate-300 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-700">Service gratuit</span>
                  </label>

                  {/* Option Négociable */}
                  <label className={`flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white transition-colors duration-200 ${
                    form.estGratuit ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300 cursor-pointer'
                  }`}>
                    <input
                      type="checkbox"
                      checked={form.estNegociable}
                      onChange={(e) => setForm(prev => ({ ...prev, estNegociable: e.target.checked }))}
                      disabled={form.estGratuit}
                      className="w-5 h-5 text-slate-900 rounded border-slate-300 cursor-pointer disabled:opacity-50"
                    />
                    <span className="text-sm font-medium text-slate-700">Prix négociable</span>
                  </label>
                </div>

                {/* Champ montant */}
                {!form.estGratuit && (
                  <div className="pt-4 border-t border-slate-200">
                    <div className="relative">
                      <input
                        type="number"
                        name="montant"
                        value={form.montant}
                        onChange={handleChange}
                        placeholder="Entrez le montant"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-right text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all duration-200 font-semibold text-base"
                        min="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-semibold text-sm">XOF</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2 : Photos */}
            <div className="space-y-5">
              <SectionHeader 
                icon={<ImageIcon className="w-5 h-5" />} 
                title="Galerie photos"
                subtitle="Ajoutez jusqu'à 6 photos pour augmenter vos chances"
              />

              <div className="space-y-3">
                {form.photos.map((photo, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors duration-200 group">
                    {/* Aperçu */}
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
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

                    {/* Input URL */}
                    <input
                      type="text"
                      value={photo}
                      onChange={(e) => handlePhotoChange(i, e.target.value)}
                      placeholder="Collez l'URL de votre photo"
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all duration-200"
                    />

                    {/* Bouton supprimer */}
                    {form.photos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhotoField(i)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                        title="Supprimer cette photo"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Compteur et bouton ajouter */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-600">
                  <span className="font-semibold text-slate-900">{form.photos.filter(p => p.trim()).length}</span>/6 photos
                </span>
                {form.photos.length < 6 && (
                  <button
                    type="button"
                    onClick={addPhotoField}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une photo
                  </button>
                )}
              </div>
            </div>

            {/* Section 3 : Localisation */}
            <div className="space-y-5">
              <SectionHeader 
                icon={<MapPin className="w-5 h-5" />} 
                title="Localisation"
                subtitle="Où offrez-vous votre service ?"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Pays <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.pays}
                    disabled
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium cursor-not-allowed opacity-75"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Ville <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="ville"
                    value={form.ville}
                    onChange={handleChange}
                    placeholder="Cotonou, Porto-Novo..."
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Quartier <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <input
                  type="text"
                  name="quartier"
                  value={form.quartier}
                  onChange={handleChange}
                  placeholder="Fidjrossè, Menontin..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Détails supplémentaires <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  name="details"
                  value={form.details}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Détails sur la localisation, accès, parking..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all duration-200 resize-none"
                />
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-black disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Publication...
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
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type=number] {
          -moz-appearance: textfield;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 0.6s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Deposer;
