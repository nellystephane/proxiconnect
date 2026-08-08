import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User, Phone, Sparkles, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Input, Button } from '../../components/ui';

interface FormErrors {
  nom?: string;
  prenom?: string;
  email?: string;
  motDePasse?: string;
  telephone?: string;
  ville?: string;
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
    if (!form.ville.trim()) newErrors.ville = 'La ville est obligatoire';
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

        <div className="glass-solid rounded-3xl p-8 shadow-xl">
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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <Input name="nom" label="Nom" value={form.nom} onChange={handleChange} error={errors.nom} icon={<User className="w-4 h-4" />} placeholder="Kouassi" autoComplete="family-name" />
              <Input name="prenom" label="Prénom" value={form.prenom} onChange={handleChange} error={errors.prenom} icon={<User className="w-4 h-4" />} placeholder="Amina" autoComplete="given-name" />
            </div>

            <Input type="email" name="email" label="Email" value={form.email} onChange={handleChange} error={errors.email} icon={<Mail className="w-4 h-4" />} placeholder="amina@exemple.com" autoComplete="email" />

            <Input
              type="password"
              name="motDePasse"
              label="Mot de passe"
              value={form.motDePasse}
              onChange={handleChange}
              error={errors.motDePasse}
              icon={<Lock className="w-4 h-4" />}
              placeholder="••••••••"
              autoComplete="new-password"
              hint="Minimum 6 caractères"
            />

            <Input
              type="tel"
              name="telephone"
              label={<>Téléphone <span className="text-gray-400 normal-case font-normal">(optionnel)</span></>}
              value={form.telephone}
              onChange={handleChange}
              error={errors.telephone}
              icon={<Phone className="w-4 h-4" />}
              placeholder="+229 01 23 45 67 89"
              autoComplete="tel"
            />

            <Input
              name="ville"
              label={<>Ville <span className="text-red-400">*</span></>}
              value={form.ville}
              onChange={handleChange}
              error={errors.ville}
              icon={<MapPin className="w-4 h-4" />}
              placeholder="Cotonou"
              autoComplete="address-level2"
            />

            <Button type="submit" loading={loading} fullWidth icon={!loading ? <Sparkles className="w-4 h-4" /> : undefined}>
              S'inscrire gratuitement
            </Button>
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