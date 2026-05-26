import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User, Phone, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface FormErrors {
  nom?: string;
  prenom?: string;
  email?: string;
  motDePasse?: string;
  telephone?: string;
}

const Inscription = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    telephone: '',
    ville: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.nom.trim()) newErrors.nom = 'Le nom est obligatoire';
    if (!form.prenom.trim()) newErrors.prenom = 'Le prénom est obligatoire';
    if (!form.email.trim()) {
      newErrors.email = "L'email est obligatoire";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Format d'email invalide";
    }
    if (!form.motDePasse) {
      newErrors.motDePasse = 'Le mot de passe est obligatoire';
    } else if (form.motDePasse.length < 6) {
      newErrors.motDePasse = '6 caractères minimum';
    }
    if (form.telephone.trim() && !/^\+229\s?\d{10}$/.test(form.telephone.trim())) {
      newErrors.telephone = 'Format: +229 01XXXXXXXX (10 chiffres)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name as keyof FormErrors]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err: any) {
      const message = err.response?.data?.message || '';
      if (message.toLowerCase().includes('existe déjà') || message.toLowerCase().includes('already exists')) {
        setServerError('Cet utilisateur existe déjà.');
      } else if (message.toLowerCase().includes('email')) {
        setServerError("Cet email n'est pas valide ou est déjà utilisé.");
      } else if (message.toLowerCase().includes('mot de passe')) {
        setServerError('Le mot de passe ne respecte pas les critères.');
      } else if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        setServerError('Impossible de contacter le serveur. Vérifiez votre connexion.');
      } else {
        setServerError(message || "Une erreur inattendue s'est produite.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: keyof FormErrors) =>
    `w-full pl-10 pr-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2 focus:bg-white ${
      errors[field] ? 'border border-red-400 focus:ring-red-300' : 'border border-transparent focus:ring-blue-400'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-gray-200/60">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 rounded-full px-4 py-1 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Rejoignez ProxiConnect
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Inscription</h1>
            <p className="text-sm text-gray-500 mt-1">Créez votre compte gratuit</p>
          </div>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-6">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Nom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    className={inputClass('nom')}
                    placeholder="Kouassi"
                  />
                </div>
                {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Prénom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="prenom"
                    value={form.prenom}
                    onChange={handleChange}
                    className={inputClass('prenom')}
                    placeholder="Amina"
                  />
                </div>
                {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={inputClass('email')}
                  placeholder="amina@exemple.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  name="motDePasse"
                  value={form.motDePasse}
                  onChange={handleChange}
                  className={inputClass('motDePasse')}
                  placeholder="••••••••"
                />
              </div>
              {errors.motDePasse && <p className="text-red-500 text-xs mt-1">{errors.motDePasse}</p>}
              <p className="text-[10px] text-gray-400 mt-1">Minimum 6 caractères</p>
            </div>

            <div>
            
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">
                Téléphone <span className="text-gray-400">(optionnel)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  name="telephone"
                  value={form.telephone}
                  onChange={handleChange}
                  className={inputClass('telephone')}
                  placeholder="+229 01 23 45 67 89"
                />
              </div>
              {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
            </div>
          
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Ville</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="ville"
                  value={form.ville}
                  onChange={handleChange}
                  className={inputClass('ville')}
                  placeholder="Cotonou"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  S'inscrire gratuitement
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{' '}
            <Link to="/connexion" className="text-blue-600 font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Inscription;