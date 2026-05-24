import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FormErrors {
  email?: string;
  motDePasse?: string;
}

const Connexion = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', motDePasse: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.email.trim()) newErrors.email = "L'email est obligatoire";
    if (!form.motDePasse) newErrors.motDePasse = 'Le mot de passe est obligatoire';
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
      await login(form.email, form.motDePasse);
      navigate('/', { replace: true });
    } catch (err: any) {
      const message = err.response?.data?.message || '';
      if (message.toLowerCase().includes('mot de passe') || message.toLowerCase().includes('password')) {
        setServerError('Mot de passe incorrect.');
      } else if (message.toLowerCase().includes('email') || message.toLowerCase().includes('utilisateur')) {
        setServerError('Email ou utilisateur introuvable.');
      } else if (err.message === 'Network Error') {
        setServerError('Impossible de contacter le serveur. Vérifiez votre connexion.');
      } else {
        setServerError(message || 'Une erreur est survenue. Veuillez réessayer.');
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
              <LogIn className="w-3.5 h-3.5" />
              Content de vous revoir
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
            <p className="text-sm text-gray-500 mt-1">Accédez à votre espace</p>
          </div>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-6">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  <LogIn className="w-4 h-4" />
                  Se connecter
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="text-blue-600 font-semibold hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Connexion;