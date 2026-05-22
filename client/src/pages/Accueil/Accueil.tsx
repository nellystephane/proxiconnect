// import { Link } from 'react-router-dom';
// import { useState, useEffect, useRef } from 'react';
// import {
//   MapPin,
//   Users,
//   Star,
//   Shield,
//   Zap,
//   TrendingUp,
//   ChevronRight,
//   ArrowRight,
//   Sparkles,
// } from 'lucide-react';

// /* ---------- Types ---------- */
// interface MousePositionType {
//   x: number;
//   y: number;
// }

// interface CategoryType {
//   name: string;
//   icon: React.ComponentType<{ className?: string }>;
//   color: string;
// }

// interface FeatureType {
//   icon: React.ComponentType<{ className?: string }>;
//   title: string;
//   desc: string;
// }

// interface StepType {
//   step: string;
//   icon: React.ComponentType<{ className?: string }>;
//   title: string;
//   desc: string;
//   gradient: string;
// }

// /* ---------- Composant ---------- */
// const Accueil = () => {
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [scrollY, setScrollY] = useState(0);
//   const [mousePosition, setMousePosition] = useState<MousePositionType>({
//     x: 0.5,
//     y: 0.5,
//   });
//   const carouselRef = useRef<HTMLDivElement>(null);
//   const containerRef = useRef<HTMLDivElement>(null);

//   // Scroll listener
//   useEffect(() => {
//     const handleScroll = () => setScrollY(window.scrollY);
//     window.addEventListener('scroll', handleScroll, { passive: true });
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   // Fermer le menu mobile au scroll
//   useEffect(() => {
//     if (!isMobileMenuOpen) return;
//     const closeMenu = () => setIsMobileMenuOpen(false);
//     window.addEventListener('scroll', closeMenu, { passive: true });
//     return () => window.removeEventListener('scroll', closeMenu);
//   }, [isMobileMenuOpen]);

//   // Parallax souris (desktop uniquement, effet décoratif)
//   useEffect(() => {
//     const handleMouseMove = (e: MouseEvent) => {
//       const rect = containerRef.current?.getBoundingClientRect();
//       if (rect) {
//         setMousePosition({
//           x: (e.clientX - rect.left) / rect.width,
//           y: (e.clientY - rect.top) / rect.height,
//         });
//       }
//     };
//     window.addEventListener('mousemove', handleMouseMove, { passive: true });
//     return () => window.removeEventListener('mousemove', handleMouseMove);
//   }, []);

//   // Carousel auto-scroll
//   useEffect(() => {
//     if (!carouselRef.current) return;
//     const carousel = carouselRef.current;
//     let animationFrameId: number;
//     const scroll = () => {
//       carousel.scrollLeft += 0.4;
//       if (
//         carousel.scrollLeft >=
//         carousel.scrollWidth - carousel.clientWidth
//       ) {
//         carousel.scrollLeft = 0;
//       }
//       animationFrameId = requestAnimationFrame(scroll);
//     };
//     animationFrameId = requestAnimationFrame(scroll);
//     return () => cancelAnimationFrame(animationFrameId);
//   }, []);

//   /* ---------- Data ---------- */
//   const categories: CategoryType[] = [
//     { name: 'Électricité', icon: Zap, color: 'from-amber-400 to-orange-500' },
//     { name: 'Plomberie', icon: TrendingUp, color: 'from-blue-400 to-cyan-500' },
//     { name: 'Couture', icon: Sparkles, color: 'from-pink-400 to-rose-500' },
//     { name: 'Coiffure', icon: Users, color: 'from-purple-400 to-violet-500' },
//     { name: 'Cours', icon: Star, color: 'from-emerald-400 to-green-500' },
//     { name: 'Vente', icon: MapPin, color: 'from-red-400 to-orange-500' },
//     { name: 'Transport', icon: Zap, color: 'from-blue-500 to-indigo-500' },
//     { name: 'Autres', icon: Sparkles, color: 'from-cyan-400 to-blue-400' },
//   ];

//   const features: FeatureType[] = [
//     {
//       icon: MapPin,
//       title: 'Hyper local',
//       desc: 'Trouvez des services dans votre quartier, sans algorithme compliqué.',
//     },
//     {
//       icon: Shield,
//       title: 'Avis vérifiés',
//       desc: 'Chaque avis est lié à une transaction réelle et sécurisée.',
//     },
//     {
//       icon: TrendingUp,
//       title: 'Boostez votre visibilité',
//       desc: 'Abonnements abordables pour mettre en avant votre activité.',
//     },
//     {
//       icon: Users,
//       title: 'Communauté active',
//       desc: '+1 200 membres qui échangent en toute confiance au quotidien.',
//     },
//   ];

//   const steps: StepType[] = [
//     {
//       step: '1',
//       icon: Users,
//       title: 'Créez votre compte',
//       desc: 'Inscrivez-vous gratuitement en 30 secondes.',
//       gradient: 'from-blue-500 to-indigo-500',
//     },
//     {
//       step: '2',
//       icon: Sparkles,
//       title: 'Publiez votre annonce',
//       desc: 'Photos, description, prix. Simple et rapide.',
//       gradient: 'from-indigo-500 to-purple-500',
//     },
//     {
//       step: '3',
//       icon: Zap,
//       title: 'Recevez des demandes',
//       desc: 'Votre annonce est visible par les clients autour de vous.',
//       gradient: 'from-purple-500 to-pink-500',
//     },
//   ];

//   /* ---------- Rendu ---------- */
//   return (
//     <div
//       ref={containerRef}
//       className="relative min-h-screen w-full overflow-x-hidden bg-slate-50"
//     >
//       {/* ========== HEADER ========== */}
//       <header
//         className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
//           scrollY > 20
//             ? 'bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 shadow-lg shadow-black/20'
//             : 'bg-transparent'
//         }`}
//       >
//         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//           <div className="flex h-16 items-center justify-between">
//             {/* LOGO */}
//             <Link
//               to="/"
//               className="group flex items-center gap-2.5 no-underline"
//             >
//               <div className="relative">
//                 <div className="absolute inset-0 bg-[#007AFF] rounded-lg blur opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
//                 <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#007AFF] to-indigo-600 shadow-lg shadow-blue-500/30 transition-transform duration-300 group-hover:scale-105">
//                   <MapPin className="w-5 h-5 text-white" />
//                 </div>
//               </div>
//               <span className="relative overflow-hidden">
//                 <span className="block font-bold text-lg text-white tracking-tight transition-transform duration-300 group-hover:-translate-y-4">
//                   ProxiConnect
//                 </span>
//                 <span className="absolute left-0 top-full block font-bold text-lg bg-gradient-to-r from-[#007AFF] to-indigo-400 bg-clip-text text-transparent tracking-tight transition-transform duration-300 group-hover:-translate-y-4">
//                   ProxiConnect
//                 </span>
//               </span>
//             </Link>

//             {/* NAVIGATION DESKTOP */}
//             <nav className="hidden md:flex items-center gap-1">
//               {[
//                 { label: 'Accueil', href: '/' },
//                 { label: 'Annonces', href: '/annonces' },
//                 { label: 'Comment ça marche', href: '#comment-ca-marche' },
//               ].map((link) => (
//                 <Link
//                   key={link.label}
//                   to={link.href}
//                   className="group relative px-4 py-2 text-sm font-medium text-slate-300 no-underline transition-colors duration-300 hover:text-white"
//                 >
//                   {link.label}
//                   <span className="absolute bottom-0 left-1/2 h-0.5 w-0 bg-gradient-to-r from-[#007AFF] to-indigo-400 transition-all duration-300 group-hover:left-0 group-hover:w-full" />
//                 </Link>
//               ))}
//             </nav>

//             {/* ACTIONS */}
//             <div className="flex items-center gap-3">
//               <Link
//                 to="/connexion"
//                 className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-slate-300 no-underline transition-colors duration-300 hover:text-white"
//               >
//                 Se connecter
//               </Link>
//               <Link
//                 to="/inscription"
//                 className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#007AFF] to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/50 hover:scale-105 active:scale-95"
//               >
//                 <span className="relative z-10">S'inscrire</span>
//                 <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
//                 <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
//               </Link>
//               <button
//                 onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//                 className="md:hidden relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-900/50 text-slate-300 backdrop-blur-sm transition-all duration-300 hover:border-blue-400/40 hover:text-white hover:bg-slate-800/60"
//                 aria-label="Menu"
//               >
//                 <div className="relative w-5 h-4">
//                   <span
//                     className={`absolute left-0 h-0.5 w-5 bg-current rounded-full transition-all duration-300 ${
//                       isMobileMenuOpen ? 'top-2 rotate-45' : 'top-0'
//                     }`}
//                   />
//                   <span
//                     className={`absolute left-0 top-2 h-0.5 w-5 bg-current rounded-full transition-all duration-300 ${
//                       isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
//                     }`}
//                   />
//                   <span
//                     className={`absolute left-0 h-0.5 w-5 bg-current rounded-full transition-all duration-300 ${
//                       isMobileMenuOpen ? 'top-2 -rotate-45' : 'top-4'
//                     }`}
//                   />
//                 </div>
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* MENU MOBILE */}
//         <div
//           className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
//             isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
//           }`}
//         >
//           <div className="mx-4 mb-4 rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-xl p-4 space-y-2">
//             {[
//               { label: 'Accueil', href: '/' },
//               { label: 'Annonces', href: '/annonces' },
//               { label: 'Comment ça marche', href: '#comment-ca-marche' },
//               { label: 'Se connecter', href: '/connexion' },
//             ].map((link) => (
//               <Link
//                 key={link.label}
//                 to={link.href}
//                 onClick={() => setIsMobileMenuOpen(false)}
//                 className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-300 no-underline transition-all duration-200 hover:bg-slate-800/60 hover:text-white hover:pl-5"
//               >
//                 {link.label}
//               </Link>
//             ))}
//           </div>
//         </div>
//       </header>

//       {/* ===== BACKGROUND LUMIÈRE ===== */}
//       <div className="pointer-events-none fixed inset-0 overflow-hidden">
//         <div
//           className="absolute top-[-10%] left-[15%] h-[500px] w-[500px] rounded-full bg-blue-400/15 blur-[120px] animate-float-slow"
//           style={{
//             transform: `translate(${(mousePosition.x - 0.5) * 30}px, ${
//               (mousePosition.y - 0.5) * 30
//             }px)`,
//             transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
//           }}
//         />
//         <div
//           className="absolute bottom-[-5%] right-[10%] h-[450px] w-[450px] rounded-full bg-indigo-400/15 blur-[100px] animate-float-delayed"
//           style={{
//             transform: `translate(${(mousePosition.x - 0.5) * -20}px, ${
//               (mousePosition.y - 0.5) * -20
//             }px)`,
//             transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
//           }}
//         />
//         <div className="absolute top-[35%] left-[50%] h-[350px] w-[350px] rounded-full bg-sky-300/10 blur-[80px] animate-pulse-slow" />
//         <div
//           className="absolute inset-0 opacity-[0.03]"
//           style={{
//             backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)`,
//             backgroundSize: '40px 40px',
//           }}
//         />
//       </div>

//       {/* ===== CONTENU ===== */}
//       <div className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
//         {/* ========== HERO PLEIN ÉCRAN ========== */}
//         <section className="flex min-h-[85vh] flex-col items-center justify-center space-y-8 text-center px-4">
//           {/* Badge */}
//           <div
//             className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/80 px-4 py-1.5 text-xs font-medium text-slate-600 backdrop-blur-md shadow-sm animate-fade-in-scale"
//             style={
//               {
//                 animationDuration: '0.8s',
//                 animationDelay: '0s',
//               } as React.CSSProperties
//             }
//           >
//             <Sparkles className="w-3.5 h-3.5 text-[#007AFF] animate-spin-slow" />
//             <span>Lancez votre activité gratuitement</span>
//           </div>

//           {/* Titre avec révélation staggerée */}
//           <div className="space-y-2 overflow-hidden max-w-4xl">
//             <h1
//               className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight text-slate-900 leading-[0.95] animate-slide-in-blur"
//               style={
//                 {
//                   animationDuration: '1s',
//                   animationDelay: '0.1s',
//                 } as React.CSSProperties
//               }
//             >
//               Le talent local,
//             </h1>
//             <h1
//               className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-[0.95] animate-slide-in-blur"
//               style={
//                 {
//                   animationDuration: '1s',
//                   animationDelay: '0.25s',
//                   background:
//                     'linear-gradient(135deg, #007AFF 0%, #6366f1 50%, #ec4899 100%)',
//                   backgroundClip: 'text',
//                   WebkitBackgroundClip: 'text',
//                   WebkitTextFillColor: 'transparent',
//                 } as React.CSSProperties
//               }
//             >
//               à portée de main
//             </h1>
//           </div>

//           {/* Sous-titre */}
//           <p
//             className="max-w-2xl text-base text-slate-500 sm:text-lg leading-relaxed animate-fade-in"
//             style={
//               {
//                 animationDuration: '0.8s',
//                 animationDelay: '0.4s',
//               } as React.CSSProperties
//             }
//           >
//             ProxiConnect relie les artisans, commerçants et clients de votre
//             quartier. Sans algorithme opaque. Juste du local, du vrai, du
//             rapide.
//           </p>

//           {/* CTA */}
//           <div
//             className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-4 animate-fade-in"
//             style={
//               {
//                 animationDuration: '0.8s',
//                 animationDelay: '0.5s',
//               } as React.CSSProperties
//             }
//           >
//             <Link
//               to="/inscription"
//               className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[#007AFF] px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-500/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/30 active:translate-y-0"
//             >
//               <span className="relative z-10">Commencer gratuitement</span>
//               <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
//               <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
//             </Link>
//             <Link
//               to="/annonces"
//               className="group inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-8 py-4 text-sm font-semibold text-slate-700 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-blue-400/50 hover:bg-blue-50/60 hover:text-[#007AFF] active:translate-y-0"
//             >
//               Voir les annonces
//               <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
//             </Link>
//           </div>

//           {/* Icônes flottantes */}
//           <div className="mt-8 flex gap-4 sm:gap-6">
//             {[
//               { icon: MapPin, delay: '0.6s' },
//               { icon: Users, delay: '0.7s' },
//               { icon: Star, delay: '0.8s' },
//             ].map(({ icon: Icon, delay }, i) => (
//               <div
//                 key={i}
//                 className="rounded-2xl border border-slate-200/60 bg-white/70 p-4 sm:p-5 backdrop-blur-md shadow-sm transition-all duration-500 hover:border-blue-300/50 hover:bg-blue-50/50 hover:scale-110 animate-bounce-in"
//                 style={
//                   {
//                     animationDuration: '0.8s',
//                     animationDelay: delay,
//                   } as React.CSSProperties
//                 }
//               >
//                 <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#007AFF]" />
//               </div>
//             ))}
//           </div>

//           {/* Scroll indicator */}
//           <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
//             <span className="text-[10px] uppercase tracking-widest text-slate-400">
//               Scroll
//             </span>
//             <div className="w-px h-8 bg-gradient-to-b from-slate-400 to-transparent animate-pulse" />
//           </div>
//         </section>

//         {/* ========== COMMENT ÇA MARCHE ========== */}
//         <section id="comment-ca-marche" className="py-20">
//           <h2
//             className="text-3xl sm:text-4xl font-bold text-slate-900 mb-16 text-center tracking-tight animate-slide-up"
//             style={
//               {
//                 animationDuration: '0.8s',
//                 animationDelay: '0.7s',
//               } as React.CSSProperties
//             }
//           >
//             En trois étapes simples
//           </h2>

//           <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
//             {/* Ligne connecteur */}
//             <div className="hidden md:block absolute top-16 left-[18%] right-[18%] h-0.5 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

//             {steps.map((etape, i) => (
//               <div
//                 key={i}
//                 className="group relative rounded-3xl p-8 border border-slate-200/60 bg-white/60 text-center space-y-5 backdrop-blur-md shadow-sm transition-all duration-500 hover:-translate-y-3 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300/40 animate-slide-up"
//                 style={
//                   {
//                     animationDuration: '0.8s',
//                     animationDelay: `${0.8 + i * 0.1}s`,
//                   } as React.CSSProperties
//                 }
//               >
//                 {/* Glow au hover */}
//                 <div
//                   className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${etape.gradient} opacity-0 blur-2xl group-hover:opacity-[0.07] transition-opacity duration-500`}
//                 />

//                 <div
//                   className={`relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${etape.gradient} shadow-lg shadow-blue-500/20 transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl`}
//                 >
//                   <etape.icon className="w-6 h-6 text-white" />
//                 </div>
//                 <h3 className="relative text-lg font-bold text-slate-900">
//                   {etape.title}
//                 </h3>
//                 <p className="relative text-sm text-slate-500 leading-relaxed">
//                   {etape.desc}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </section>

//         {/* ========== POURQUOI PROXICONNECT ========== */}
//         <section className="py-20">
//           <h2
//             className="text-3xl sm:text-4xl font-bold text-slate-900 mb-12 text-center tracking-tight animate-slide-up"
//             style={
//               {
//                 animationDuration: '0.8s',
//                 animationDelay: '1.1s',
//               } as React.CSSProperties
//             }
//           >
//             Pourquoi nous choisir ?
//           </h2>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//             {features.map((arg, i) => (
//               <div
//                 key={i}
//                 className="group relative rounded-3xl p-7 flex items-start gap-5 border border-slate-200/60 bg-white/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-300/40 backdrop-blur-md animate-slide-up"
//                 style={
//                   {
//                     animationDuration: '0.8s',
//                     animationDelay: `${1.2 + i * 0.08}s`,
//                   } as React.CSSProperties
//                 }
//               >
//                 <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-[#007AFF] transition-all duration-500 group-hover:scale-110 group-hover:from-blue-100 group-hover:to-indigo-100">
//                   <arg.icon className="w-6 h-6" />
//                 </div>
//                 <div>
//                   <h3 className="text-base font-bold text-slate-900 mb-2">
//                     {arg.title}
//                   </h3>
//                   <p className="text-sm text-slate-500 leading-relaxed">
//                     {arg.desc}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </section>

//         {/* ========== CATÉGORIES CAROUSEL ========== */}
//         <section className="py-20">
//           <h2
//             className="text-3xl sm:text-4xl font-bold text-slate-900 mb-10 text-center tracking-tight animate-slide-up"
//             style={
//               {
//                 animationDuration: '0.8s',
//                 animationDelay: '1.5s',
//               } as React.CSSProperties
//             }
//           >
//             Explorez les catégories
//           </h2>

//           <div className="relative">
//             {/* Dégradés latéraux */}
//             <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-slate-50 to-transparent z-20 pointer-events-none" />
//             <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-slate-50 to-transparent z-20 pointer-events-none" />

//             <div
//               ref={carouselRef}
//               className="flex gap-4 overflow-x-hidden scroll-smooth pb-4 px-2"
//             >
//               {[...categories, ...categories].map((cat, idx) => (
//                 <Link
//                   key={idx}
//                   to={`/annonces?categorie=${encodeURIComponent(cat.name)}`}
//                   className="group relative shrink-0 inline-flex items-center gap-3 rounded-full border border-slate-200/60 bg-white/70 px-6 py-3.5 text-sm font-medium text-slate-700 backdrop-blur-md shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-md hover:shadow-blue-500/10 hover:border-blue-300/50 hover:text-[#007AFF]"
//                 >
//                   <div
//                     className={`flex items-center justify-center h-6 w-6 rounded-lg bg-gradient-to-br ${cat.color} text-white transition-all duration-500 group-hover:rotate-12 group-hover:scale-110`}
//                   >
//                     <cat.icon className="w-4 h-4" />
//                   </div>
//                   <span>{cat.name}</span>
//                 </Link>
//               ))}
//             </div>
//           </div>

//           {/* Indicateur */}
//           <div className="mt-6 flex justify-center gap-2 items-center">
//             <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-pulse" />
//             <span className="text-xs text-slate-400">
//               Défilement automatique
//             </span>
//           </div>
//         </section>

//         {/* ========== CHIFFRES CLÉS ========== */}
//         <section
//           className="py-20 animate-slide-up"
//           style={
//             {
//               animationDuration: '0.8s',
//               animationDelay: '1.7s',
//             } as React.CSSProperties
//           }
//         >
//           <div className="relative rounded-[2rem] border border-slate-200/60 bg-gradient-to-br from-white/80 via-slate-50/60 to-white/60 p-10 sm:p-16 text-center overflow-hidden backdrop-blur-md shadow-sm">
//             {/* Lumière dynamique souris */}
//             <div
//               className="absolute inset-0 opacity-30 pointer-events-none"
//               style={{
//                 background: `radial-gradient(circle at ${
//                   mousePosition.x * 100
//                 }% ${mousePosition.y * 100}%, rgba(59,130,246,0.12) 0%, transparent 70%)`,
//                 transition: 'background 0.3s ease-out',
//               }}
//             />

//             <div className="relative grid grid-cols-3 gap-8">
//               <div className="space-y-3 group cursor-default">
//                 <p className="text-4xl sm:text-5xl font-black text-slate-900 transition-all duration-500 group-hover:scale-110">
//                   +500
//                 </p>
//                 <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
//                   Annonces actives
//                 </p>
//               </div>
//               <div className="space-y-3 border-l border-r border-slate-200/50 group cursor-default">
//                 <p className="text-4xl sm:text-5xl font-black text-slate-900 transition-all duration-500 group-hover:scale-110">
//                   +1.2K
//                 </p>
//                 <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
//                   Membres
//                 </p>
//               </div>
//               <div className="space-y-3 group cursor-default">
//                 <div className="flex justify-center gap-1 mb-2">
//                   {[...Array(5)].map((_, i) => (
//                     <Star
//                       key={i}
//                       className="w-5 h-5 fill-amber-400 text-amber-400 animate-twinkle"
//                       style={
//                         {
//                           animationDelay: `${i * 0.15}s`,
//                         } as React.CSSProperties
//                       }
//                     />
//                   ))}
//                 </div>
//                 <p className="text-xs font-semibold text-slate-400">
//                   4.8/5 sur 200+ avis
//                 </p>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* ========== CTA FINAL ========== */}
//         <section
//           className="py-20 animate-slide-up"
//           style={
//             {
//               animationDuration: '0.8s',
//               animationDelay: '1.8s',
//             } as React.CSSProperties
//           }
//         >
//           <div className="relative rounded-[2rem] border border-white/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-10 sm:p-16 text-center overflow-hidden backdrop-blur-sm">
//             {/* Orbes de fond */}
//             <div className="absolute top-[-40%] right-[-10%] w-72 h-72 bg-blue-200/25 rounded-full blur-3xl animate-float-slow" />
//             <div className="absolute bottom-[-20%] left-[-5%] w-56 h-56 bg-indigo-200/25 rounded-full blur-3xl animate-float-delayed" />

//             <div className="relative z-10 space-y-8">
//               <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
//                 Prêt à développer votre activité localement ?
//               </h2>
//               <Link
//                 to="/inscription"
//                 className="group inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-10 py-5 text-base font-semibold text-white shadow-xl shadow-blue-500/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/30 active:translate-y-0"
//               >
//                 Créer un compte gratuit
//                 <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
//               </Link>
//             </div>
//           </div>
//         </section>
//       </div>

//       {/* ========== FOOTER ========== */}
//       <footer className="relative border-t border-slate-800/60 bg-slate-950/50 backdrop-blur-xl mt-24">
//         <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
//           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
//             {/* Left: Logo & Copyright */}
//             <div className="flex flex-col items-center md:items-start gap-2">
//               <Link to="/" className="flex items-center gap-2 group">
//                 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-110">
//                   <MapPin className="w-4 h-4 text-white" />
//                 </div>
//                 <span className="font-bold text-lg text-white tracking-tight">
//                   ProxiConnect
//                 </span>
//               </Link>
//               <p className="text-xs text-slate-500">
//                 © {new Date().getFullYear()} ProxiConnect. Tous droits
//                 réservés.
//               </p>
//             </div>

//             {/* Center: Links */}
//             <nav className="flex flex-wrap justify-center gap-6 sm:gap-8">
//               {[
//                 { label: 'À propos', href: '#' },
//                 { label: 'Confidentialité', href: '#' },
//                 { label: 'Conditions', href: '#' },
//                 { label: 'Contact', href: '#' },
//               ].map((link) => (
//                 <Link
//                   key={link.label}
//                   to={link.href}
//                   className="text-sm font-medium text-slate-400 no-underline transition-colors duration-300 hover:text-blue-400 relative group"
//                 >
//                   {link.label}
//                   <span className="absolute -bottom-1 left-0 w-0 h-px bg-blue-400 transition-all duration-300 group-hover:w-full" />
//                 </Link>
//               ))}
//             </nav>

//             {/* Right: Socials */}
//             <div className="flex items-center gap-4">
//               <a
//                 href="#"
//                 className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900/50 text-slate-400 transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400 hover:scale-110"
//                 aria-label="Twitter"
//               >
//                 <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
//                   <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
//                 </svg>
//               </a>
//               <a
//                 href="#"
//                 className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900/50 text-slate-400 transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400 hover:scale-110"
//                 aria-label="Instagram"
//               >
//                 <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
//                   <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
//                 </svg>
//               </a>
//             </div>
//           </div>
//         </div>
//       </footer>

//       {/* ===== GLOBAL STYLES ===== */}
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
//         * { font-family: 'Inter', sans-serif; }

//         @media (prefers-reduced-motion: no-preference) {
//           .animate-slide-up {
//             animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
//             opacity: 0; transform: translateY(30px);
//           }
//           @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }

//           .animate-slide-in-blur {
//             animation: slideInBlur 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
//             opacity: 0; filter: blur(12px); transform: translateY(20px);
//           }
//           @keyframes slideInBlur { to { opacity: 1; filter: blur(0); transform: translateY(0); } }

//           .animate-fade-in {
//             animation: fadeIn 0.8s ease-out forwards; opacity: 0;
//           }
//           @keyframes fadeIn { to { opacity: 1; } }

//           .animate-fade-in-scale {
//             animation: fadeInScale 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
//             opacity: 0; transform: scale(0.9);
//           }
//           @keyframes fadeInScale { to { opacity: 1; transform: scale(1); } }

//           .animate-bounce-in {
//             animation: bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
//             opacity: 0; transform: scale(0.7);
//           }
//           @keyframes bounceIn { to { opacity: 1; transform: scale(1); } }

//           .animate-float-slow {
//             animation: floatSlow 10s ease-in-out infinite;
//           }
//           @keyframes floatSlow {
//             0%, 100% { transform: translate(0, 0) scale(1); }
//             50% { transform: translate(15px, -25px) scale(1.05); }
//           }

//           .animate-float-delayed {
//             animation: floatDelayed 12s ease-in-out infinite;
//           }
//           @keyframes floatDelayed {
//             0%, 100% { transform: translate(0, 0) scale(1); }
//             50% { transform: translate(-20px, 15px) scale(1.08); }
//           }

//           .animate-pulse-slow {
//             animation: pulseSlow 8s ease-in-out infinite;
//           }
//           @keyframes pulseSlow {
//             0%, 100% { opacity: 0.25; transform: scale(1); }
//             50% { opacity: 0.5; transform: scale(1.1); }
//           }

//           .animate-spin-slow {
//             animation: spin 6s linear infinite;
//           }
//           @keyframes spin {
//             from { transform: rotate(0deg); }
//             to { transform: rotate(360deg); }
//           }

//           .animate-twinkle {
//             animation: twinkle 2s ease-in-out infinite;
//           }
//           @keyframes twinkle {
//             0%, 100% { opacity: 0.5; transform: scale(1); }
//             50% { opacity: 1; transform: scale(1.15); }
//           }
//         }
//         html { scroll-behavior: smooth; }

//         ::-webkit-scrollbar { width: 6px; }
//         ::-webkit-scrollbar-track { background: transparent; }
//         ::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.25); border-radius: 3px; }
//         ::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.4); }
//       `}</style>
//     </div>
//   );
// };

// export default Accueil;

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Users, Star, Shield, Zap, TrendingUp, Sparkles,
  ChevronRight, ArrowRight, X, Eye, Clock, Package, Search,
  Menu, Layers, CreditCard, BadgeCheck, PhoneCall, Globe
} from 'lucide-react';
import API from '../../api/axios';

/* ---------- Types ---------- */
interface Annonce {
  _id: string;
  titre: string;
  description: string;
  categorie: string;
  prix: { montant: number; estNegociable: boolean; estGratuit: boolean };
  photos: string[];
  localisation: { ville: string; quartier: string; details: string };
  createur: { nom: string; prenom: string };
  nombreVues: number;
  createdAt: string;
}

/* ---------- Composant ---------- */
const Accueil = () => {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loadingAnnonces, setLoadingAnnonces] = useState(true);
  const [selectedAnnonce, setSelectedAnnonce] = useState<Annonce | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  // Parallax souris (effet desktop)
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

  // Charger les annonces depuis l'API
  useEffect(() => {
    const fetchAnnonces = async () => {
      try {
        const { data } = await API.get('/annonces?limite=6');
        setAnnonces(data.annonces || []);
      } catch (err) {
        console.error('Impossible de charger les annonces', err);
      } finally {
        setLoadingAnnonces(false);
      }
    };
    fetchAnnonces();
  }, []);

  // Carrousel catégories
  useEffect(() => {
    if (!carouselRef.current) return;
    const carousel = carouselRef.current;
    let animationFrameId: number;
    const scroll = () => {
      carousel.scrollLeft += 0.5;
      if (carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth) {
        carousel.scrollLeft = 0;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };
    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const categories = [
    { name: 'Électricité', icon: Zap, color: 'from-amber-400 to-orange-500' },
    { name: 'Plomberie', icon: TrendingUp, color: 'from-blue-400 to-cyan-500' },
    { name: 'Couture', icon: Sparkles, color: 'from-pink-400 to-rose-500' },
    { name: 'Coiffure', icon: Users, color: 'from-purple-400 to-violet-500' },
    { name: 'Cours', icon: Star, color: 'from-emerald-400 to-green-500' },
    { name: 'Vente', icon: MapPin, color: 'from-red-400 to-orange-500' },
    { name: 'Transport', icon: Zap, color: 'from-blue-500 to-indigo-500' },
    { name: 'Autres', icon: Sparkles, color: 'from-cyan-400 to-blue-400' },
  ];

  return (
    <div ref={containerRef} className="relative min-h-screen bg-slate-50 overflow-x-hidden">
      {/* ===== BACKGROUND LUMIÈRE ===== */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-[-10%] left-[15%] h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-[120px] animate-float-slow"
          style={{
            transform: `translate(${(mousePosition.x - 0.5) * 30}px, ${(mousePosition.y - 0.5) * 30}px)`,
            transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
        <div
          className="absolute bottom-[-5%] right-[10%] h-[450px] w-[450px] rounded-full bg-indigo-100/40 blur-[100px] animate-float-delayed"
          style={{
            transform: `translate(${(mousePosition.x - 0.5) * -20}px, ${(mousePosition.y - 0.5) * -20}px)`,
            transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
      </div>

      {/* ===== HEADER FIXE ===== */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3">
        <div className="glass rounded-2xl px-5 py-3 flex items-center justify-between shadow-sm max-w-6xl mx-auto">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#007AFF] to-indigo-600 shadow-md shadow-blue-500/20">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">ProxiConnect</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/connexion" className="text-sm font-medium text-gray-600 hover:text-[#007AFF] no-underline transition">
              Se connecter
            </Link>
            <Link
              to="/inscription"
              className="bg-[#007AFF] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-blue-600 transition no-underline shadow-md shadow-blue-500/20"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="pt-28 pb-16 px-4 flex flex-col items-center justify-center min-h-screen text-center animate-slide-up">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-600">
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Votre talent mérite d'être vu</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-tight">
            Trouvez le bon prestataire,<br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              à deux pas de chez vous
            </span>
          </h1>

          <p className="text-gray-500 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            ProxiConnect relie les artisans, commerçants et clients de votre quartier.
            Publiez une annonce gratuite, découvrez des talents locaux, et développez votre activité sans complication.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link
              to="/inscription"
              className="inline-flex items-center gap-2 bg-[#007AFF] text-white px-8 py-4 rounded-full font-semibold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition no-underline"
            >
              Commencer gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#annonces"
              className="inline-flex items-center gap-2 glass px-8 py-4 rounded-full font-semibold text-gray-700 hover:shadow-md transition no-underline"
            >
              Voir les annonces
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="pt-12 text-gray-400 text-sm animate-pulse">
            Faites défiler pour en savoir plus
          </div>
        </div>
      </section>

      {/* ===== COMMENT ÇA MARCHE ===== */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
          En trois étapes simples
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              icon: <Users className="w-6 h-6 text-white" />,
              title: 'Inscrivez-vous',
              desc: 'Créez votre compte gratuit en 30 secondes. Aucun engagement.',
              color: 'bg-blue-500',
            },
            {
              step: '2',
              icon: <Package className="w-6 h-6 text-white" />,
              title: 'Publiez votre annonce',
              desc: 'Photos, description, prix. Montrez votre talent au monde.',
              color: 'bg-indigo-500',
            },
            {
              step: '3',
              icon: <Zap className="w-6 h-6 text-white" />,
              title: 'Trouvez des clients',
              desc: 'Votre annonce est visible par les clients autour de vous.',
              color: 'bg-purple-500',
            },
          ].map((etape, i) => (
            <div key={i} className="group relative rounded-3xl p-8 border border-gray-200/60 bg-white/70 backdrop-blur-md text-center space-y-5 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
              <div className={`relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${etape.color} shadow-lg shadow-blue-200 transition-all duration-500 group-hover:scale-110`}>
                {etape.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{etape.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{etape.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== POURQUOI PROXICONNECT ===== */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
          Pourquoi choisir ProxiConnect ?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { icon: <MapPin className="w-6 h-6" />, title: 'Hyper local', desc: 'Trouvez des talents dans votre quartier, sans algorithme opaque.' },
            { icon: <Shield className="w-6 h-6" />, title: 'Avis vérifiés', desc: 'Chaque avis est lié à une transaction réelle. La confiance avant tout.' },
            { icon: <TrendingUp className="w-6 h-6" />, title: 'Boostez votre activité', desc: 'Des abonnements abordables pour mettre en avant votre annonce.' },
            { icon: <Users className="w-6 h-6" />, title: 'Communauté active', desc: '+1 200 membres qui échangent chaque jour sur la plateforme.' },
          ].map((item, i) => (
            <div key={i} className="glass rounded-3xl p-6 flex gap-4 items-start hover:-translate-y-1 transition">
              <div className="shrink-0 w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-[#007AFF]">
                {item.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{item.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CATÉGORIES CAROUSEL ===== */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-10">
          Explorez les catégories
        </h2>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />
          <div ref={carouselRef} className="flex gap-4 overflow-x-hidden scroll-smooth pb-4">
            {[...categories, ...categories].map((cat, idx) => (
              <Link
                key={idx}
                to={`/annonces?categorie=${encodeURIComponent(cat.name)}`}
                className="shrink-0 inline-flex items-center gap-3 glass rounded-full px-6 py-3 text-sm font-medium text-gray-700 no-underline hover:shadow-md transition"
              >
                <div className={`flex items-center justify-center h-6 w-6 rounded-lg bg-gradient-to-br ${cat.color} text-white`}>
                  <cat.icon className="w-4 h-4" />
                </div>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ANNONCES RÉCENTES ===== */}
      <section id="annonces" className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
          Annonces récentes
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Découvrez les dernières offres près de chez vous
        </p>

        {loadingAnnonces ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : annonces.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucune annonce pour le moment.</p>
            <Link to="/deposer" className="text-[#007AFF] text-sm font-medium mt-2 inline-block">
              Soyez le premier à déposer une annonce
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {annonces.map((annonce) => (
              <div
                key={annonce._id}
                onClick={() => setSelectedAnnonce(annonce)}
                className="glass rounded-2xl p-5 cursor-pointer hover:shadow-lg transition space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#007AFF] font-bold">
                    {annonce.createur?.prenom?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {annonce.createur?.prenom} {annonce.createur?.nom}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {annonce.localisation?.ville || 'Localisation inconnue'}
                    </p>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 line-clamp-2">{annonce.titre}</h3>
                <p className="text-gray-500 text-sm line-clamp-2">{annonce.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {annonce.nombreVues} vues
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(annonce.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <span className="font-bold text-blue-600">
                    {annonce.prix.estGratuit
                      ? 'Gratuit'
                      : `${annonce.prix.montant.toLocaleString()} XOF`}
                  </span>
                  {annonce.prix.estNegociable && !annonce.prix.estGratuit && (
                    <span className="text-gray-400 text-xs ml-2">(négociable)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== À PROPOS ===== */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <div className="glass rounded-3xl p-8 sm:p-12 space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">
            À propos de ProxiConnect
          </h2>
          <div className="space-y-6 text-gray-600 leading-relaxed text-base">
            <p>
              <strong>ProxiConnect</strong> est née d'un constat simple : en Afrique, les talents locaux
              manquent de visibilité et les clients peinent à trouver des prestataires fiables près de chez eux.
              Nous avons créé une plateforme qui met en relation directe les <strong>artisans, commerçants,
              prestataires de services et clients</strong>, sans intermédiaire opaque.
            </p>
            <p>
              Notre mission est de <strong>valoriser le savoir-faire local</strong> en offrant un espace
              où chacun peut proposer ses services ou produits, gratuitement, avec une localisation précise
              (ville, quartier, points de repère). Nous croyons que la technologie doit s'adapter aux réalités
              du terrain, pas l'inverse. C'est pourquoi ProxiConnect fonctionne sans GPS complexe : une
              simple description de votre emplacement suffit.
            </p>
            <p>
              <strong>Pour les prestataires</strong>, ProxiConnect est un tremplin : publiez une annonce
              gratuite, gagnez en visibilité, recevez des demandes, et développez votre activité.
              Des abonnements abordables (30 jours, 90 jours, annuel) vous permettent de booster votre
              annonce et d'accéder à des fonctionnalités premium comme la vidéo ou la mise en avant.
            </p>
            <p>
              <strong>Pour les clients</strong>, c'est l'assurance de trouver rapidement un électricien,
              un plombier, une couturière ou un vendeur près de chez vous, avec des avis vérifiés et
              la possibilité de payer en mobile money (Orange, MTN, Moov, Wave, Celtiis).
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
            <div className="text-center p-4">
              <div className="text-3xl font-black text-[#007AFF]">+500</div>
              <div className="text-sm text-gray-500">Annonces actives</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-black text-[#007AFF]">+1 200</div>
              <div className="text-sm text-gray-500">Membres</div>
            </div>
            <div className="text-center p-4">
              <div className="flex justify-center items-center gap-1 text-amber-400 text-xl">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <div className="text-sm text-gray-500">4.8/5 sur 200+ avis</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER MINIMAL ===== */}
      <footer className="py-8 border-t border-gray-200 text-center text-sm text-gray-400">
        <div className="max-w-6xl mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} ProxiConnect. Tous droits réservés.</p>
        </div>
      </footer>

       {/* ===== POPUP ANNONCE ===== */}
      {selectedAnnonce && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={() => setSelectedAnnonce(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-xl text-gray-900">{selectedAnnonce.titre}</h2>
              <button
                onClick={() => setSelectedAnnonce(null)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#007AFF] font-bold">
                {selectedAnnonce.createur?.prenom?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {selectedAnnonce.createur?.prenom} {selectedAnnonce.createur?.nom}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selectedAnnonce.localisation?.ville || 'Localisation inconnue'}
                  {selectedAnnonce.localisation?.quartier && ` - ${selectedAnnonce.localisation.quartier}`}
                </p>
              </div>
            </div>
            <p className="text-gray-700 text-sm">{selectedAnnonce.description}</p>
            {selectedAnnonce.localisation?.details && (
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                <strong>📍 Précisions :</strong> {selectedAnnonce.localisation.details}
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="font-bold text-blue-600 text-lg">
                {selectedAnnonce.prix.estGratuit
                  ? 'Gratuit'
                  : `${selectedAnnonce.prix.montant.toLocaleString()} XOF`}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Eye className="w-3 h-3" /> {selectedAnnonce.nombreVues} vues
              </span>
            </div>
            <Link
              to="/inscription"
              className="block w-full text-center bg-[#007AFF] text-white py-3 rounded-xl font-semibold no-underline hover:bg-blue-600 transition"
            >
              S'inscrire pour contacter
            </Link>
          </div>
        </div>
      )}

      {/* ===== STYLES ===== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .glass {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.4);
        }
        @media (prefers-reduced-motion: no-preference) {
          .animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(24px); }
          @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
          .animate-float-slow { animation: floatSlow 10s ease-in-out infinite; }
          @keyframes floatSlow { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,-30px) scale(1.05); } }
          .animate-float-delayed { animation: floatDelayed 12s ease-in-out infinite; }
          @keyframes floatDelayed { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-25px,20px) scale(1.08); } }
          .animate-spin-slow { animation: spin 6s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
};

export default Accueil;