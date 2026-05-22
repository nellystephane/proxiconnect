import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface MousePositionType {
  x: number;
  y: number;
}

interface FormType {
  email: string;
  motDePasse: string;
}

const Connexion = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [mousePosition, setMousePosition] = useState<MousePositionType>({ x: 0.5, y: 0.5 });
  const [form, setForm] = useState<FormType>({ email: '', motDePasse: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

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
    // ✅ Correction : passer les arguments séparément
    await login(form.email, form.motDePasse);
    
    const from = (location.state as { from?: string })?.from || '/';
    navigate(from, { replace: true });
  } catch (err: any) {
    setError(err.response?.data?.message || 'Email ou mot de passe incorrect.');
  } finally {
    setLoading(false);
  }
};

  const inputBaseClass = "w-full pl-11 pr-12 py-3.5 bg-slate-900/60 border border-slate-700/50 rounded-2xl text-sm text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-blue-400/60 focus:ring-4 focus:ring-blue-500/20 focus:bg-slate-900/80";
  const labelBaseClass = "block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider";

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-slate-950">
      
      {/* ===== BACKGROUND ANIMÉ ===== */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px] animate-float-slow"
          style={{
            transform: `translate(${(mousePosition.x - 0.5) * 40}px, ${(mousePosition.y - 0.5) * 40}px)`,
            transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
        <div
          className="absolute bottom-[-5%] right-[15%] h-[450px] w-[450px] rounded-full bg-indigo-500/20 blur-[100px] animate-float-delayed"
          style={{
            transform: `translate(${(mousePosition.x - 0.5) * -30}px, ${(mousePosition.y - 0.5) * -30}px)`,
            transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
        <div className="absolute top-[40%] left-[50%] h-[300px] w-[300px] rounded-full bg-sky-400/15 blur-[80px] animate-pulse-slow" />
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%\' height=\'100%\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }}
        />
      </div>

      {/* ===== CONTENU ===== */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-slide-up" style={{ animationDuration: '0.8s' } as React.CSSProperties}>
          
          {/* Retour */}          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-slate-400 no-underline transition-all duration-300 hover:text-blue-400 mb-8"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 group-hover:border-blue-400/40 group-hover:bg-blue-500/10">
              <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            </div>
            <span>Retour à l'accueil</span>
          </Link>

          {/* Card Glassmorphism */}
          <div className="relative rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 via-slate-950/60 to-slate-900/80 p-8 sm:p-10 backdrop-blur-xl shadow-2xl shadow-black/40">
            
            {/* Lumière dynamique */}
            <div
              className="absolute inset-0 opacity-30 pointer-events-none rounded-3xl"
              style={{
                background: `radial-gradient(ellipse at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(59,130,246,0.15) 0%, transparent 70%)`,
                transition: 'background 0.3s ease-out',
              }}
            />

            {/* Header */}
            <div className="relative text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-md mb-4 animate-fade-in-scale">
                <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Bon retour parmi nous</span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Connexion
              </h1>
              <p className="text-sm text-slate-400 mt-2">
                Accédez à votre espace ProxiConnect
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="relative mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 animate-fade-in">
                <div className="mt-0.5 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span>{error}</span>
              </div>
            )}

            {/* Success Message (optional - for demo) */}
            {location.state?.success && (              <div className="relative mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300 animate-fade-in">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{location.state.success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="relative space-y-5">
              
              {/* Email */}
              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' } as React.CSSProperties}>
                <label className={labelBaseClass}>Email</label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${focusedField === 'email' ? 'text-blue-400' : 'text-slate-500'}`} />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className={inputBaseClass}
                    placeholder="jean@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' } as React.CSSProperties}>
                <label className={labelBaseClass}>Mot de passe</label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${focusedField === 'motDePasse' ? 'text-blue-400' : 'text-slate-500'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="motDePasse"
                    value={form.motDePasse}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('motDePasse')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className={inputBaseClass}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  {/* Toggle visibility */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors duration-200"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between pt-2 animate-slide-up" style={{ animationDelay: '0.3s' } as React.CSSProperties}>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-5 rounded-lg border border-slate-600 bg-slate-900/60 transition-all duration-200 peer-checked:border-blue-400 peer-checked:bg-blue-500 peer-focus:ring-2 peer-focus:ring-blue-500/30" />
                    <svg className="absolute left-0 top-0 h-5 w-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">Se souvenir de moi</span>
                </label>
                <Link
                  to="/mot-de-passe-oublie"
                  className="text-xs font-medium text-blue-400 no-underline hover:text-blue-300 transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-xl animate-slide-up"
                style={{ animationDelay: '0.4s' } as React.CSSProperties}
              >
                <span className={`relative z-10 flex items-center justify-center gap-2 transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                  <Sparkles className="w-4 h-4" />
                  Se connecter
                </span>
                
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  </div>
                )}                
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/50" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gradient-to-br from-slate-900/80 to-slate-950/60 px-4 text-xs text-slate-500">
                  ou
                </span>
              </div>
            </div>

            {/* Sign up Link */}
            <p className="relative text-center text-sm text-slate-400 animate-slide-up" style={{ animationDelay: '0.5s' } as React.CSSProperties}>
              Pas encore de compte ?{' '}
              <Link
                to="/inscription"
                className="group inline-flex items-center gap-1 font-semibold text-blue-400 no-underline transition-colors duration-300 hover:text-blue-300"
              >
                Créer un compte
                <ArrowLeft className="w-3.5 h-3.5 rotate-180 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </p>

            {/* Trust badges */}
            <div className="relative mt-8 flex items-center justify-center gap-4 text-[10px] text-slate-500 animate-fade-in" style={{ animationDelay: '0.6s' } as React.CSSProperties}>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Connexion sécurisée</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>RGPD compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== GLOBAL STYLES ===== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }

        @media (prefers-reduced-motion: no-preference) {          .animate-slide-up {
            animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0; transform: translateY(24px);
          }
          @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }

          .animate-fade-in {
            animation: fadeIn 0.6s ease-out forwards; opacity: 0;
          }
          @keyframes fadeIn { to { opacity: 1; } }

          .animate-fade-in-scale {
            animation: fadeInScale 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
            opacity: 0; transform: scale(0.95);
          }
          @keyframes fadeInScale { to { opacity: 1; transform: scale(1); } }

          .animate-float-slow {
            animation: floatSlow 10s ease-in-out infinite;
          }
          @keyframes floatSlow {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(20px, -30px) scale(1.05); }
          }

          .animate-float-delayed {
            animation: floatDelayed 12s ease-in-out infinite;
          }
          @keyframes floatDelayed {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-25px, 20px) scale(1.08); }
          }

          .animate-pulse-slow {
            animation: pulseSlow 8s ease-in-out infinite;
          }
          @keyframes pulseSlow {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.15); }
          }

          .animate-spin-slow {
            animation: spin 6s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.5); }
      `}</style>
    </div>
  );
};

export default Connexion;