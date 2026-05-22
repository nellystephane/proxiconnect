import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User, Phone, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FormType {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  telephone: string;
}

const Inscription = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [form, setForm] = useState<FormType>({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    telephone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Parallax souris
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const inputBaseClass =
    "w-full pl-11 pr-4 py-3.5 bg-white/80 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 outline-none transition-all duration-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:bg-white shadow-sm";

  const labelBaseClass = "block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider";

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Fond décoratif clair */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-[120px] animate-float-slow"
          style={{
            transform: `translate(${(mousePosition.x - 0.5) * 40}px, ${(mousePosition.y - 0.5) * 40}px)`,
            transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
        <div
          className="absolute bottom-[-5%] right-[15%] h-[450px] w-[450px] rounded-full bg-indigo-100/40 blur-[100px] animate-float-delayed"
          style={{
            transform: `translate(${(mousePosition.x - 0.5) * -30}px, ${(mousePosition.y - 0.5) * -30}px)`,
            transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
        <div className="absolute top-[40%] left-[50%] h-[300px] w-[300px] rounded-full bg-sky-100/40 blur-[80px] animate-pulse-slow" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-slide-up" style={{ animationDuration: '0.8s' } as React.CSSProperties}>
          
          {/* Retour */}
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 no-underline transition-all duration-300 hover:text-blue-600 mb-8"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm transition-all duration-300 group-hover:border-blue-200 group-hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            </div>
            <span>Retour à l'accueil</span>
          </Link>

          {/* Carte blanche glassmorphism */}
          <div className="relative rounded-3xl border border-gray-200/60 bg-white/80 backdrop-blur-xl p-8 sm:p-10 shadow-xl shadow-gray-200/50">
            
            {/* Lumière dynamique */}
            <div
              className="absolute inset-0 opacity-30 pointer-events-none rounded-3xl"
              style={{
                background: `radial-gradient(ellipse at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(59,130,246,0.12) 0%, transparent 70%)`,
                transition: 'background 0.3s ease-out',
              }}
            />

            <div className="relative text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-600 backdrop-blur-md mb-4 animate-fade-in-scale">
                <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Rejoignez ProxiConnect</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Créez votre compte
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Accédez à votre espace en moins d'une minute
              </p>
            </div>

            {error && (
              <div className="relative mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 animate-fade-in">
                <span className="mt-0.5">❌</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' } as React.CSSProperties}>
                  <label className={labelBaseClass}>Nom</label>
                  <div className="relative">
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${focusedField === 'nom' ? 'text-blue-500' : 'text-gray-400'}`} />
                    <input name="nom" value={form.nom} onChange={handleChange} onFocus={() => setFocusedField('nom')} onBlur={() => setFocusedField(null)} required className={inputBaseClass} placeholder="Dupont" autoComplete="family-name" />
                  </div>
                </div>
                <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.15s' } as React.CSSProperties}>
                  <label className={labelBaseClass}>Prénom</label>
                  <div className="relative">
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${focusedField === 'prenom' ? 'text-blue-500' : 'text-gray-400'}`} />
                    <input name="prenom" value={form.prenom} onChange={handleChange} onFocus={() => setFocusedField('prenom')} onBlur={() => setFocusedField(null)} required className={inputBaseClass} placeholder="Jean" autoComplete="given-name" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' } as React.CSSProperties}>
                <label className={labelBaseClass}>Email</label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${focusedField === 'email' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <input type="email" name="email" value={form.email} onChange={handleChange} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} required className={inputBaseClass} placeholder="jean@email.com" autoComplete="email" />
                </div>
              </div>

              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.25s' } as React.CSSProperties}>
                <label className={labelBaseClass}>Mot de passe</label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${focusedField === 'motDePasse' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <input type="password" name="motDePasse" value={form.motDePasse} onChange={handleChange} onFocus={() => setFocusedField('motDePasse')} onBlur={() => setFocusedField(null)} required className={inputBaseClass} placeholder="••••••••" autoComplete="new-password" minLength={6} />
                </div>
                <p className="text-[10px] text-gray-400 pl-1">Minimum 6 caractères</p>
              </div>

              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.3s' } as React.CSSProperties}>
                <label className={labelBaseClass}>Téléphone <span className="text-gray-400">(optionnel)</span></label>
                <div className="relative">
                  <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${focusedField === 'telephone' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <input type="tel" name="telephone" value={form.telephone} onChange={handleChange} onFocus={() => setFocusedField('telephone')} onBlur={() => setFocusedField(null)} className={inputBaseClass} placeholder="+229 97 12 34 56" autoComplete="tel" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-2xl bg-blue-500 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all duration-500 hover:bg-blue-600 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
              >
                <span className={`relative z-10 flex items-center justify-center gap-2 ${loading ? 'invisible' : ''}`}>
                  <Sparkles className="w-4 h-4" />
                  S'inscrire gratuitement
                </span>
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  </div>
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs text-gray-400">ou</span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 animate-slide-up" style={{ animationDelay: '0.4s' } as React.CSSProperties}>
              Déjà un compte ?{' '}
              <Link to="/connexion" className="font-semibold text-blue-600 hover:text-blue-500 transition">
                Se connecter <ArrowLeft className="inline w-3.5 h-3.5 rotate-180" />
              </Link>
            </p>

            <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-gray-400 animate-fade-in">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Données sécurisées</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Gratuit & sans engagement</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        @media (prefers-reduced-motion: no-preference) {
          .animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(24px); }
          @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; opacity: 0; }
          @keyframes fadeIn { to { opacity: 1; } }
          .animate-fade-in-scale { animation: fadeInScale 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards; opacity: 0; transform: scale(0.95); }
          @keyframes fadeInScale { to { opacity: 1; transform: scale(1); } }
          .animate-float-slow { animation: floatSlow 10s ease-in-out infinite; }
          @keyframes floatSlow { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(20px, -30px) scale(1.05); } }
          .animate-float-delayed { animation: floatDelayed 12s ease-in-out infinite; }
          @keyframes floatDelayed { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-25px, 20px) scale(1.08); } }
          .animate-pulse-slow { animation: pulseSlow 8s ease-in-out infinite; }
          @keyframes pulseSlow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.1); } }
          .animate-spin-slow { animation: spin 6s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
};

export default Inscription;