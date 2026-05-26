import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Sparkles, ImagePlus, MapPin } from 'lucide-react';
import API from '../../api/axios';

const CATEGORIES = [
  'Électricité', 'Plomberie', 'Maçonnerie', 'Peinture', 'Menuiserie',
  'Couture', 'Coiffure', 'Esthétique', 'Cours particuliers',
  'Informatique', 'Agriculture', 'Vente de produits', 'Location',
  'Transport', 'Autre'
];

const Deposer = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    titre: '',
    description: '',
    categorie: '',
    sousCategorie: '',
    type: 'service' as 'service' | 'vente' | 'autre',
    montant: '',
    estNegociable: false,
    estGratuit: false,
    photos: [''],
    pays: '',
    ville: '',
    quartier: '',
    details: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm(prev => ({ ...prev, [name]: val }));
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

    // Validation simple
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
      navigate('/mes-annonces', { replace: true }); // redirige vers la liste des annonces (à créer)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'annonce.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
         onClick={() => navigate(-1)}>
      <div
        className="relative w-full max-w-2xl bg-white/80 backdrop-blur-xl border border-white/40 rounded-t-3xl shadow-2xl overflow-y-auto animate-slide-up"
        style={{ height: '97vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Bouton fermer */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 z-10 p-2 bg-white/60 backdrop-blur-md rounded-full hover:bg-white transition"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="p-6 space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 rounded-full px-4 py-1 text-xs font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Déposer une annonce</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Nouvelle annonce</h2>
            <p className="text-sm text-gray-500">Remplissez les informations ci-dessous</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                name="titre"
                value={form.titre}
                onChange={handleChange}
                placeholder="Ex: Électricien pro disponible"
                className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Décrivez votre service, vos tarifs, vos disponibilités..."
                className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Catégorie + Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <select
                  name="categorie"
                  value={form.categorie}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400"
                  required
                >
                  <option value="">Sélectionnez</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400"
                >
                  <option value="service">Service</option>
                  <option value="vente">Vente</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>

            {/* Sous-catégorie (optionnel) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sous-catégorie <span className="text-gray-400">(optionnel)</span>
              </label>
              <input
                name="sousCategorie"
                value={form.sousCategorie}
                onChange={handleChange}
                placeholder="Précisez..."
                className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Prix */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Prix</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    name="estGratuit"
                    checked={form.estGratuit}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-400"
                  />
                  Gratuit
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    name="estNegociable"
                    checked={form.estNegociable}
                    onChange={handleChange}
                    disabled={form.estGratuit}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-400"
                  />
                  Négociable
                </label>
              </div>
              {!form.estGratuit && (
                <div className="relative">
                  <input
                    type="number"
                    name="montant"
                    value={form.montant}
                    onChange={handleChange}
                    placeholder="Montant (XOF)"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400"
                    min="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">XOF</span>
                </div>
              )}
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos ({form.photos.filter(p => p.trim()).length}/6)
              </label>
              <div className="space-y-2">
                {form.photos.map((photo, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={photo}
                      onChange={e => handlePhotoChange(i, e.target.value)}
                      placeholder="URL de la photo (https://...)"
                      className="flex-1 px-4 py-2 bg-white/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400"
                    />
                    {form.photos.length > 1 && (
                      <button type="button" onClick={() => removePhotoField(i)}
                              className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition">
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {form.photos.length < 6 && (
                  <button type="button" onClick={addPhotoField}
                          className="flex items-center gap-2 text-sm text-blue-500 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition">
                    <Plus className="w-4 h-4" />
                    Ajouter une photo
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Pour le moment, utilisez des URLs d’images (la gestion par upload viendra plus tard).
              </p>
            </div>

            {/* Localisation */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                Localisation
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                  <input
                    name="pays"
                    value={form.pays}
                    onChange={handleChange}
                    placeholder="Bénin"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                  <input
                    name="ville"
                    value={form.ville}
                    onChange={handleChange}
                    placeholder="Cotonou"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quartier (optionnel)</label>
                <input
                  name="quartier"
                  value={form.quartier}
                  onChange={handleChange}
                  placeholder="Akpakpa"
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Détails (points de repère)</label>
                <input
                  name="details"
                  value={form.details}
                  onChange={handleChange}
                  placeholder="À côté de la pharmacie Saint-Jean..."
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
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
    </div>
  );
};

export default Deposer;