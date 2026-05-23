import { Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin, Users, Star, Shield, Zap, TrendingUp,
  ChevronRight, ArrowRight, Sparkles, Menu, X, CheckCircle2,
  Quote, MessageCircle, HelpCircle, Search, Clock, Award
} from 'lucide-react';

// ===== TYPES =====
interface MousePositionType { x: number; y: number }
interface NavLinkType { label: string; href: string; external?: boolean }
interface CategoryType { name: string; icon: React.ComponentType<{ className?: string }>; color: string; count: string }
interface StepType { step: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string; gradient: string }
interface FeatureType { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }
interface TestimonialType { name: string; role: string; text: string; avatar: string; rating: number }
interface FAQType { q: string; a: string }

const Accueil = () => {
  // ===== STATE & REFS =====
  const [mousePosition, setMousePosition] = useState<MousePositionType>({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement[]>([]);

  // ===== NAVIGATION LINKS =====
  const navLinks: NavLinkType[] = [
    { label: 'Accueil', href: '#hero' },
    { label: 'Annonces', href: '#annonces' },
    { label: 'À propos', href: '#apropos' },
    { label: 'Comment ça marche', href: '#comment' },
  ];

  // ===== DATA =====
  const categories: CategoryType[] = [
    { name: 'Électricité', icon: Zap, color: 'from-amber-400 to-orange-500', count: '+140' },
    { name: 'Plomberie', icon: TrendingUp, color: 'from-blue-400 to-cyan-500', count: '+95' },
    { name: 'Couture & Retouches', icon: Sparkles, color: 'from-pink-400 to-rose-500', count: '+80' },
    { name: 'Coiffure & Beauté', icon: Users, color: 'from-purple-400 to-violet-500', count: '+110' },
    { name: 'Cours & Soutien', icon: Star, color: 'from-green-400 to-emerald-500', count: '+65' },
    { name: 'Vente & Occasions', icon: MapPin, color: 'from-red-400 to-orange-500', count: '+200' },
    { name: 'Transport & Livraison', icon: Zap, color: 'from-blue-500 to-indigo-500', count: '+75' },
    { name: 'Jardinage & Bricolage', icon: Sparkles, color: 'from-teal-400 to-cyan-500', count: '+50' },
  ];

  const steps: StepType[] = [
    { step: '01', icon: Users, title: 'Inscrivez-vous en 30 secondes', desc: 'Aucune carte bancaire requise. Créez votre profil, validez votre identité et accédez instantanément à un réseau de professionnels et de clients dans votre quartier.', gradient: 'from-blue-500 to-indigo-600' },    { step: '02', icon: Sparkles, title: 'Publiez votre annonce en 3 clics', desc: 'Ajoutez photos, tarifs, disponibilités et zone d\'intervention. Notre système de géolocalisation intelligente diffuse votre offre directement aux habitants à moins de 5 km.', gradient: 'from-indigo-500 to-purple-600' },
    { step: '03', icon: Zap, title: 'Recevez des demandes qualifiées', desc: 'Discutez en temps réel via notre messagerie intégrée, planifiez des rendez-vous et développez votre activité sans intermédiaire, sans commission cachée, sans algorithme opaque.', gradient: 'from-purple-500 to-pink-600' },
  ];

  const features: FeatureType[] = [
    { icon: MapPin, title: 'Ancrage territorial réel', desc: 'Nous ne géolocalisons pas pour surveiller. Nous utilisons votre quartier pour créer du lien. Chaque interaction reste humaine, directe et traçable.' },
    { icon: Shield, title: 'Confiance & sécurité garanties', desc: 'Avis vérifiés après transaction, profils authentifiés par pièce d\'identité et modération active 7j/7. Nous protégeons aussi bien les artisans que les clients.' },
    { icon: TrendingUp, title: 'Visibilité maîtrisée, pas algorithmique', desc: 'Fini les boost payants opaques. Abonnez-vous à un plan transparent pour rester visible auprès de votre audience cible locale, sans surprise de facturation.' },
    { icon: Award, title: 'Économie circulaire & solidaire', desc: 'En consommant local, vous réduisez votre empreinte carbone, soutenez l\'emploi de proximité et participez activement à la vitalité économique de votre commune.' },
  ];

  const testimonials: TestimonialType[] = [
    { name: 'Amina K.', role: 'Coiffeuse à domicile', text: 'En 3 mois, j\'ai doublé ma clientèle. Fini les flyers jetés. ProxiConnect m\'apporte des clients qui savent exactement ce qu\'ils cherchent.', avatar: '👩🏾‍🦱', rating: 5 },
    { name: 'Thomas L.', role: 'Plombier indépendant', text: 'La transparence des avis et la géolocalisation changent tout. Je ne perds plus de temps à prospecter. Les demandes arrivent directement dans mon quartier.', avatar: '👨🏻‍🔧', rating: 5 },
    { name: 'Fatou D.', role: 'Cliente régulière', text: 'J\'ai trouvé un électricien fiable en 10 minutes. Le paiement sécurisé et les avis vérifiés m\'ont rassurée. Je recommande à tout mon voisinage.', avatar: '👩🏽‍💼', rating: 5 },
  ];

  const faqs: FAQType[] = [
    { q: 'L\'inscription est-elle vraiment gratuite ?', a: 'Oui, à 100%. La création de compte, la publication d\'annonces et la consultation des profils sont entièrement gratuites. Nous proposons uniquement des options premium facultatives pour booster votre visibilité.' },
    { q: 'Comment sont vérifiés les avis ?', a: 'Chaque avis doit être associé à une transaction réelle et validée par les deux parties. Les tentatives de manipulation sont automatiquement filtrées et sanctionnées.' },
    { q: 'Puis-je annuler ou suspendre mon compte à tout moment ?', a: 'Absolument. Aucun engagement, aucune clause cachée. Vous pouvez suspendre ou supprimer votre profil en deux clics, et exporter vos données à tout moment.' },
    { q: 'ProxiConnect prend-il une commission sur les prestations ?', a: 'Non. Nous ne prélevons aucune commission sur vos revenus. Notre modèle économique repose sur des abonnements volontaires pour les professionnels souhaitant apparaître en tête de liste.' },
  ];

  // ===== EFFECTS =====
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
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    if (!carouselRef.current) return;    const carousel = carouselRef.current;
    const scrollSpeed = 0.4;
    let animationFrameId: number;
    const scroll = () => {
      carousel.scrollLeft += scrollSpeed;
      if (carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth) {
        carousel.scrollLeft = 0;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };
    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // IntersectionObserver pour les animations au scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            const id = entry.target.id;
            if (id) setActiveSection(id);
          }
        });
      },
      { threshold: 0.15, rootMargin: '-80px 0px 0px 0px' }
    );

    sectionsRef.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // ===== HANDLERS =====
  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      const headerOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }, []);

  const toggleFaq = (index: number) => setOpenFaq(openFaq === index ? null : index);

  // ===== RENDER =====
  return (    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* ===== BACKGROUND LUMIÈRE & TEXTURE ===== */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-[-10%] left-[15%] h-[500px] w-[500px] rounded-full bg-blue-200/40 blur-[120px] animate-float-slow"
          style={{ transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`, transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.320, 1)' }}
        />
        <div
          className="absolute bottom-[-5%] right-[10%] h-[450px] w-[450px] rounded-full bg-indigo-200/40 blur-[100px] animate-float-delayed"
          style={{ transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * -15}px)`, transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.320, 1)' }}
        />
        <div className="absolute top-[40%] left-[50%] h-[300px] w-[300px] rounded-full bg-sky-200/30 blur-[80px] animate-pulse-slow" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' result=\'noise\'/%3E%3C/filter%3E%3Crect width=\'100%\' height=\'100%\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")', backgroundSize: '120px 120px' }} />
      </div>

      {/* ===== HEADER ADAPTATIF ===== */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrollY > 40 ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200/60 shadow-sm shadow-slate-200/30' : 'bg-transparent border-transparent'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group" onClick={(e) => handleNavClick(e, '#hero')}>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#007AFF] shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-105">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Proxi<span className="text-[#007AFF]">Connect</span></span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} onClick={(e) => handleNavClick(e, link.href)}
                  className={`text-sm font-medium transition-colors duration-300 hover:text-[#007AFF] ${activeSection === link.href.slice(1) ? 'text-[#007AFF]' : 'text-slate-600'}`}>
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Link to="/connexion" className="text-sm font-medium text-slate-600 hover:text-[#007AFF] transition-colors px-4 py-2 rounded-lg hover:bg-slate-100">Se connecter</Link>
              <Link to="/inscription" className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0">
                S'inscrire gratuitement <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm transition-colors hover:border-blue-300 hover:bg-blue-50" aria-label="Menu mobile">
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
            </button>
          </div>        </div>

        {/* Mobile Dropdown */}
        <div className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out ${mobileMenuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="mx-4 mb-4 rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl p-4 shadow-lg shadow-slate-200/40 space-y-1">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} onClick={(e) => handleNavClick(e, link.href)} className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-[#007AFF] transition-colors">{link.label}</a>
            ))}
            <div className="border-t border-slate-100 my-2 pt-2 space-y-2">
              <Link to="/connexion" className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors text-center">Se connecter</Link>
              <Link to="/inscription" className="block rounded-xl px-4 py-3 text-sm font-semibold text-white bg-[#007AFF] hover:bg-blue-600 transition-colors text-center shadow-md shadow-blue-500/20">Créer un compte</Link>
            </div>
          </div>
        </div>
      </header>

      {/* ===== CONTENU PRINCIPAL ===== */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-20 space-y-32">
        
        {/* ========== HERO ========== */}
        <section id="hero" ref={(el) => sectionsRef.current[0] = el as HTMLDivElement} className="flex flex-col items-center space-y-10 text-center animate-on-scroll">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/80 px-5 py-2 text-sm font-semibold text-slate-700 backdrop-blur-md shadow-sm">
            <Sparkles className="w-4 h-4 text-[#007AFF] animate-spin-slow" />
            <span>La plateforme locale de confiance qui relie talents & voisins</span>
          </div>

          <h1 className="max-w-5xl text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
            Réinventez le <span className="text-[#007AFF]">commerce de proximité</span>.
          </h1>

          <p className="max-w-3xl text-lg sm:text-xl text-slate-600 leading-relaxed">
            ProxiConnect supprime les intermédiaires opaques et les commissions abusives. Nous reconnectons directement artisans, commerçants et services locaux avec les habitants de votre quartier. Fini la prospection à l'aveugle. Place au direct, au fiable, au vrai.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-2">
            <Link to="/inscription" className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[#007AFF] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-blue-500/25 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1 active:translate-y-0">
              <span className="relative z-10">Commencer gratuitement</span>
              <ArrowRight className="relative z-10 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>
            <a href="#annonces" onClick={(e) => handleNavClick(e, '#annonces')} className="group inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-8 py-4 text-base font-semibold text-slate-700 backdrop-blur-md transition-all duration-500 hover:border-blue-400/50 hover:bg-blue-50/60 hover:text-[#007AFF] hover:-translate-y-1 active:translate-y-0">
              Explorer les annonces <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-6 pt-6 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 0 commission cachée</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Profils vérifiés & modérés</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Support réactif 7j/7</div>
          </div>        </section>

        {/* ========== ANNONCES / CATÉGORIES ========== */}
        <section id="annonces" ref={(el) => sectionsRef.current[1] = el as HTMLDivElement} className="animate-on-scroll space-y-12">
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-[#007AFF] border border-blue-100">
              <Search className="w-4 h-4" /> Catalogue vivant
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Trouvez le service exact, à deux pas de chez vous</h2>
            <p className="max-w-2xl mx-auto text-slate-600">Plus de 600 professionnels actifs dans 12 catégories. Filtrez, comparez les avis vérifiés et réservez en temps réel.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {categories.map((cat, i) => (
              <Link key={cat.name} to={`/annonces?categorie=${encodeURIComponent(cat.name)}`}
                className="group relative flex flex-col items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/70 p-6 backdrop-blur-sm transition-all duration-500 hover:border-blue-400/40 hover:bg-blue-50/50 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-2">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} text-white shadow-md transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                  <cat.icon className="w-7 h-7" />
                </div>
                <span className="text-sm font-semibold text-slate-800 group-hover:text-[#007AFF] transition-colors">{cat.name}</span>
                <span className="text-xs text-slate-400">{cat.count} annonces</span>
                <span className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-4 h-4 text-[#007AFF]" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ========== COMMENT ÇA MARCHE ========== */}
        <section id="comment" ref={(el) => sectionsRef.current[2] = el as HTMLDivElement} className="animate-on-scroll space-y-16">
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-700 border border-slate-200">
              <Clock className="w-4 h-4" /> Processus optimisé
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Simple, transparent, efficace.</h2>
            <p className="max-w-2xl mx-auto text-slate-600">Une expérience pensée pour réduire les frictions, accélérer la mise en relation et garantir la sécurité de chaque transaction.</p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="hidden md:block absolute top-20 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
            {steps.map((step, i) => (
              <div key={i} className="relative rounded-3xl p-8 border border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-3 hover:border-blue-300/40">
                <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.gradient} text-white shadow-lg shadow-blue-500/20 transition-transform duration-500 hover:scale-110`}>
                  <step.icon className="w-7 h-7" />
                </div>
                <div className="absolute top-8 left-8 text-6xl font-black text-slate-100 select-none pointer-events-none">{step.step}</div>
                <h3 className="relative text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="relative text-sm text-slate-600 leading-relaxed">{step.desc}</p>
              </div>            ))}
          </div>
        </section>

        {/* ========== À PROPOS / POURQUOI NOUS ========== */}
        <section id="apropos" ref={(el) => sectionsRef.current[3] = el as HTMLDivElement} className="animate-on-scroll space-y-14">
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-1.5 text-sm font-semibold text-purple-700 border border-purple-100">
              <Shield className="w-4 h-4" /> Notre ADN
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Pourquoi ProxiConnect change la donne</h2>
            <p className="max-w-3xl mx-auto text-slate-600 leading-relaxed">
              Nous croyons que l'économie locale mérite une plateforme à la hauteur de sa valeur. Pas de surfacturation, pas d'algorithmes manipulateurs. Juste des outils modernes pour reconnecter les talents avec leur territoire, dans le respect de chacun.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feat, i) => (
              <div key={i} className="group flex items-start gap-5 rounded-2xl border border-slate-200/60 bg-white/70 p-7 backdrop-blur-sm transition-all duration-500 hover:border-blue-400/40 hover:shadow-lg hover:-translate-y-2">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#007AFF] transition-all duration-500 group-hover:bg-[#007AFF] group-hover:text-white">
                  <feat.icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========== TÉMOIGNAGES ========== */}
        <section className="animate-on-scroll space-y-12">
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700 border border-emerald-100">
              <Quote className="w-4 h-4" /> Avis clients
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Ils ont choisi le local</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="relative rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">{t.avatar}</div>
                  <div>
                    <p className="font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>                <div className="flex gap-1 mb-3 text-amber-400">
                  {[...Array(t.rating)].map((_, idx) => <Star key={idx} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">"{t.text}"</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========== FAQ ========== */}
        <section className="animate-on-scroll space-y-12 max-w-3xl mx-auto w-full">
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-sm font-semibold text-orange-700 border border-orange-100">
              <HelpCircle className="w-4 h-4" /> Questions fréquentes
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Tout ce que vous devez savoir</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-slate-200/60 bg-white/70 overflow-hidden transition-all duration-300 hover:border-blue-300/40">
                <button onClick={() => toggleFaq(i)} className="w-full flex items-center justify-between p-5 text-left focus:outline-none">
                  <span className="font-semibold text-slate-900 pr-4">{faq.q}</span>
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openFaq === i ? 'rotate-90 text-[#007AFF]' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-500 ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========== STATS / CONFIANCE ========== */}
        <section className="animate-on-scroll">
          <div className="relative rounded-3xl border border-slate-200/60 bg-gradient-to-br from-white via-slate-50 to-white p-10 sm:p-14 text-center overflow-hidden shadow-xl shadow-slate-200/40">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/80 via-transparent to-transparent pointer-events-none" />
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '+1 250', label: 'Artisans inscrits' },
                { value: '+8 400', label: 'Mises en relation' },
                { value: '98%', label: 'Taux de satisfaction' },
                { value: '4.8/5', label: 'Note moyenne' },
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-3xl sm:text-4xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>          </div>
        </section>

        {/* ========== CTA FINAL ========== */}
        <section className="animate-on-scroll">
          <div className="relative rounded-3xl border border-white/60 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-10 sm:p-16 text-center overflow-hidden backdrop-blur-sm">
            <div className="absolute top-[-40%] right-[-10%] w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-5%] w-56 h-56 bg-indigo-200/25 rounded-full blur-3xl animate-float-delayed pointer-events-none" />
            
            <div className="relative z-10 space-y-8">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 max-w-3xl mx-auto">
                Votre quartier a besoin de vos talents.<br />
                <span className="text-[#007AFF]">Rejoignez la communauté dès aujourd'hui.</span>
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/inscription" className="group inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-10 py-4 text-base font-semibold text-white shadow-xl shadow-blue-500/25 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1 active:translate-y-0">
                  Créer un compte gratuit <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <a href="#comment" onClick={(e) => handleNavClick(e, '#comment')} className="inline-flex items-center gap-2 rounded-full border border-slate-300/60 bg-white/80 px-8 py-4 text-base font-semibold text-slate-700 backdrop-blur-md transition-all duration-500 hover:border-blue-400/50 hover:text-[#007AFF]">
                  Voir comment ça marche
                </a>
              </div>
              <p className="text-xs text-slate-400">Inscription en 30 secondes • Aucune carte bancaire requise • Annulation à tout moment</p>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-200/60 bg-white/80 backdrop-blur-xl mt-16">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#007AFF] shadow-md">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900">ProxiConnect</span>
              </div>
              <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                La plateforme qui redonne du pouvoir à l'économie locale. Connexion directe, transparence totale, impact réel. Conçu pour les artisans, pensé pour les voisins.
              </p>
              <div className="flex gap-4 pt-2">
                {['Twitter', 'Instagram', 'LinkedIn'].map((social) => (
                  <a key={social} href="#" className="text-xs font-medium text-slate-400 hover:text-[#007AFF] transition-colors">{social}</a>
                ))}
              </div>
            </div>
            
            <div>              <h4 className="text-sm font-semibold text-slate-900 mb-4">Navigation</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#annonces" onClick={(e) => handleNavClick(e, '#annonces')} className="hover:text-[#007AFF] transition-colors">Annonces</a></li>
                <li><a href="#apropos" onClick={(e) => handleNavClick(e, '#apropos')} className="hover:text-[#007AFF] transition-colors">À propos</a></li>
                <li><Link to="/inscription" className="hover:text-[#007AFF] transition-colors">S'inscrire</Link></li>
                <li><Link to="/connexion" className="hover:text-[#007AFF] transition-colors">Se connecter</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Légal & Support</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-[#007AFF] transition-colors">Conditions d'utilisation</a></li>
                <li><a href="#" className="hover:text-[#007AFF] transition-colors">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-[#007AFF] transition-colors">Mentions légales</a></li>
                <li><a href="#" className="hover:text-[#007AFF] transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} ProxiConnect. Tous droits réservés.</p>
            <p>Conçu avec soin pour l'économie de proximité.</p>
          </div>
        </div>
      </footer>

      {/* ===== GLOBAL STYLES & ANIMATIONS ===== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        html { scroll-behavior: smooth; scroll-padding-top: 85px; }
        
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-on-scroll.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: no-preference) {
          .animate-pulse-slow { animation: pulseSlow 8s ease-in-out infinite; }
          @keyframes pulseSlow {
            0%, 100% { opacity: 0.25; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.08); }
          }
          .animate-float-delayed { animation: floatDelayed 12s ease-in-out infinite; }
          @keyframes floatDelayed {            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-15px, 12px) scale(1.05); }
          }
          .animate-float-slow { animation: floatSlow 10s ease-in-out infinite; }
          @keyframes floatSlow {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(20px, -30px) scale(1.05); }
          }
          .animate-spin-slow { animation: spin 8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.3); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.5); }
      `}</style>
    </div>
  );
};

export default Accueil;