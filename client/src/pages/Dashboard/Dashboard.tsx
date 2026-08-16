import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Banknote, Bell, Bike, Building2, CalendarCheck2,
  CheckCircle2, ClipboardList, Compass, Crown, Eye, Heart, LayoutGrid,
  MessageCircle, Plus, Sparkles, Star, Store, TrendingUp, UtensilsCrossed,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import type { EspaceId } from '../../context/PlatformContext';
import { useChat } from '../../context/ChatContext';
import { useNotifications } from '../../context/NotificationContext';
import { Badge, Card, EmptyState, Skeleton } from '../../components/ui';
import type {
  Annonce, AbonnementStatut, Chambre, Commande, CommandeRestaurant,
  DemandeLivraison, Livreur, Reservation,
} from '../../types';
import type { NotificationItem } from '../../context/NotificationContext';

// ─── Méta des espaces pro : chaque univers possède sa propre signature
//     chromatique (dégradé de la tuile + halo d'angle de la carte). ───
interface EspaceMeta {
  label: string;
  sousTitre: string;
  icon: LucideIcon;
  route: string;
  gradient: string;
  halo: string;
}

const ESPACE_META: Record<EspaceId, EspaceMeta> = {
  vente: {
    label: 'Ma boutique', sousTitre: 'Produits & commandes', icon: Store, route: '/vente',
    gradient: 'linear-gradient(135deg, #007AFF 0%, #5E5CE6 100%)', halo: 'rgba(0,122,255,0.12)',
  },
  restauration: {
    label: 'Mon restaurant', sousTitre: 'Carte & commandes', icon: UtensilsCrossed, route: '/restauration',
    gradient: 'linear-gradient(135deg, #FF9F0A 0%, #FF6B35 100%)', halo: 'rgba(255,159,10,0.12)',
  },
  hotel: {
    label: 'Mon hôtel', sousTitre: 'Chambres & réservations', icon: Building2, route: '/hotel',
    gradient: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)', halo: 'rgba(168,85,247,0.12)',
  },
  livraison: {
    label: 'Livraison', sousTitre: 'Courses & livraisons', icon: Bike, route: '/livraison',
    gradient: 'linear-gradient(135deg, #30D6C4 0%, #22C55E 100%)', halo: 'rgba(48,214,196,0.14)',
  },
};

// Entrées métier visibles depuis la console de chaque espace (les pages
// /vente, /restauration, /hotel et /livraison portent ces sections réelles).
const POINTS_ENTREE: Record<EspaceId, string> = {
  vente: 'Commandes · Produits · Ventes',
  restauration: 'Commandes · Carte · Plats',
  hotel: 'Réservations · Chambres · Tarifs',
  livraison: 'Courses · Livraisons · Revenus',
};

const ICONES_NOTIF: Record<string, LucideIcon> = {
  nouveau_message: MessageCircle,
  piece_jointe: MessageCircle,
  nouvelle_commande: Store,
  statut_commande: Store,
  nouvelle_reservation: Building2,
  statut_reservation: Building2,
  demande_livraison_acceptee: Bike,
  nouvelle_livraison: Bike,
  statut_livraison: Bike,
  demande_evaluation: Sparkles,
  nouvelle_evaluation_livreur: Sparkles,
  nouvel_avis: Sparkles,
  paiement_confirme: Crown,
};

const tempsEcoule = (date: string) => {
  const secondes = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secondes < 60) return "à l'instant";
  const minutes = Math.floor(secondes / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  return `il y a ${Math.floor(heures / 24)} j`;
};

const formatXOF = (montant: number) => `${montant.toLocaleString('fr-FR')} XOF`;

// ─── Raccourci du hero : les espaces actifs remplacent les raccourcis
//     génériques pour refléter le profil réel (particulier, vendeur…). ───
interface Raccourci {
  label: string;
  icon: LucideIcon;
  to: string;
  badge?: number;
}

// Briques brutes du cockpit pro : uniquement les espaces ACTIFS sont chargés,
// via exactement les mêmes endpoints que les consoles métier (aucune donnée
// inventée — si un appel échoue, la console concernée reste simplement vide).
interface BriquesPro {
  commandesVente: Commande[];
  commandesRestaurant: CommandeRestaurant[];
  chambres: Chambre[];
  reservations: Reservation[];
  livraisons: DemandeLivraison[];
  livreur: Livreur | null;
}

const BRIQUES_VIDES: BriquesPro = {
  commandesVente: [], commandesRestaurant: [], chambres: [],
  reservations: [], livraisons: [], livreur: null,
};

const Dashboard = () => {
  const { user } = useAuth();
  const { espacesActifs, nomsEspaces, chargement: chargementEspaces } = usePlatform();
  const { nonLus } = useChat();
  const { nonLues } = useNotifications();

  const [favoris, setFavoris] = useState<string[]>([]);
  const [mesAnnonces, setMesAnnonces] = useState<Annonce[]>([]);
  const [quota, setQuota] = useState({ utilisees: 0, autorisees: 1 });
  const [abonnement, setAbonnement] = useState<AbonnementStatut | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/users/favoris').catch(() => ({ data: [] })),
      API.get('/annonces/mes-annonces').catch(() => ({ data: { annonces: [], quota: { utilisees: 0, autorisees: 1 } } })),
      API.get('/paiements/statut').catch(() => ({ data: null })),
      API.get('/notifications').catch(() => ({ data: [] })),
    ]).then(([favRes, annRes, aboRes, notifRes]) => {
      setFavoris((favRes.data as (Annonce | null)[]).filter((a): a is Annonce => !!a).map((a) => a._id));
      setMesAnnonces(annRes.data.annonces || []);
      setQuota(annRes.data.quota || { utilisees: 0, autorisees: 1 });
      setAbonnement(aboRes.data);
      setNotifications((notifRes.data || []).slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const espacesActifsListe = (Object.keys(ESPACE_META) as EspaceId[]).filter((id) => espacesActifs[id]);

  // ─── Cockpit pro : dès que les espaces actifs sont connus, on charge les
  //     données métier réelles (mêmes routes que /vente, /restauration,
  //     /hotel et /livraison). Rien n'est appelé pour un espace inactif. ───
  const [briquesPro, setBriquesPro] = useState<BriquesPro>(BRIQUES_VIDES);
  const [chargementPro, setChargementPro] = useState(false);

  useEffect(() => {
    if (chargementEspaces) return;
    if (espacesActifsListe.length === 0) {
      setBriquesPro(BRIQUES_VIDES);
      return;
    }
    setChargementPro(true);
    const appels: Promise<unknown>[] = [];

    if (espacesActifs.vente) {
      appels.push(
        API.get('/commandes/recues')
          .then(({ data }) => setBriquesPro((p) => ({ ...p, commandesVente: (data || []) as Commande[] })))
          .catch(() => {}),
      );
    }
    if (espacesActifs.restauration) {
      appels.push(
        API.get('/commandes-restaurant/recues')
          .then(({ data }) => setBriquesPro((p) => ({ ...p, commandesRestaurant: (data || []) as CommandeRestaurant[] })))
          .catch(() => {}),
      );
    }
    if (espacesActifs.hotel) {
      appels.push(
        API.get('/hotels/moi')
          .then(({ data }) => setBriquesPro((p) => ({ ...p, chambres: data?.chambres || [] })))
          .catch(() => {}),
      );
      appels.push(
        API.get('/reservations/recues')
          .then(({ data }) => setBriquesPro((p) => ({ ...p, reservations: (data || []) as Reservation[] })))
          .catch(() => {}),
      );
    }
    if (espacesActifs.livraison) {
      appels.push(
        API.get('/livreurs/moi')
          .then(({ data }) => setBriquesPro((p) => ({ ...p, livreur: data as Livreur })))
          .catch(() => {}),
      );
      appels.push(
        API.get('/demandes-livraison/mes-livraisons')
          .then(({ data }) => setBriquesPro((p) => ({ ...p, livraisons: (data || []) as DemandeLivraison[] })))
          .catch(() => {}),
      );
    }

    Promise.all(appels).finally(() => setChargementPro(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargementEspaces, espacesActifs.vente, espacesActifs.restauration, espacesActifs.hotel, espacesActifs.livraison]);

  // ─── Métriques dérivées des briques chargées : exactement les mêmes
  //     formules que les aperçus des consoles métier. ───
  const metriquesVente = useMemo(() => {
    const validees = briquesPro.commandesVente.filter((c) => c.statut !== 'annulée');
    return {
      enAttente: briquesPro.commandesVente.filter((c) => c.statut === 'en_attente').length,
      validees: validees.length,
      ventes: validees.reduce((s, c) => s + c.montantTotal, 0),
    };
  }, [briquesPro.commandesVente]);

  const metriquesRestaurant = useMemo(() => {
    const validees = briquesPro.commandesRestaurant.filter((c) => c.statut !== 'annulée');
    return {
      enAttente: briquesPro.commandesRestaurant.filter((c) => c.statut === 'en_attente').length,
      enPreparation: briquesPro.commandesRestaurant.filter((c) => c.statut === 'en_préparation').length,
      revenus: validees.reduce((s, c) => s + c.montantTotal, 0),
    };
  }, [briquesPro.commandesRestaurant]);

  // Taux d'occupation : chambres confirmées dont le séjour couvre aujourd'hui
  // (même calcul que l'aperçu de la console hôtel).
  const tauxOccupation = useMemo(() => {
    if (briquesPro.chambres.length === 0) return 0;
    const maintenant = new Date();
    const occupees = new Set(
      briquesPro.reservations
        .filter((r) => r.statut === 'confirmée' && new Date(r.dateArrivee) <= maintenant && new Date(r.dateDepart) >= maintenant)
        .map((r) => (typeof r.chambre === 'object' ? r.chambre._id : r.chambre)),
    );
    return Math.round((occupees.size / briquesPro.chambres.length) * 100);
  }, [briquesPro.chambres, briquesPro.reservations]);

  const metriquesHotel = useMemo(() => ({
    enAttente: briquesPro.reservations.filter((r) => r.statut === 'en_attente').length,
    occupation: tauxOccupation,
    chambresTotal: briquesPro.chambres.length,
  }), [briquesPro.reservations, tauxOccupation, briquesPro.chambres.length]);

  const metriquesLivraison = useMemo(() => {
    const terminees = briquesPro.livraisons.filter((d) => d.statut === 'livrée');
    return {
      terminees: terminees.length,
      revenus: terminees.reduce((s, d) => s + (d.tarif || 0), 0),
      note: briquesPro.livreur?.noteMoyenne ?? null,
      evaluations: briquesPro.livreur?.nombreEvaluations ?? 0,
    };
  }, [briquesPro.livraisons, briquesPro.livreur]);

  const heureDuJour = new Date().getHours();
  const salutation = heureDuJour < 12 ? 'Bonjour' : heureDuJour < 18 ? 'Bon après-midi' : 'Bonsoir';

  const dateBrute = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dateDuJour = dateBrute.charAt(0).toUpperCase() + dateBrute.slice(1);

  const quotaRestant = quota.autorisees - quota.utilisees;
  const quotaDisponible = quotaRestant > 0;

  // Remplissage du quota d'annonces pour la jauge du cockpit (données réelles).
  const pourcentageQuota = quota.autorisees > 0
    ? Math.min(100, Math.round((quota.utilisees / quota.autorisees) * 100))
    : 0;

  // ─── Raccourcis rapides du hero : dynamiques selon les espaces activés.
  //     Un vendeur accède à sa boutique, un particulier à l'exploration. ───
  const raccourcisRapides: Raccourci[] = [
    ...(espacesActifsListe.length > 0
      ? espacesActifsListe.slice(0, 2).map((id) => ({
          label: ESPACE_META[id].label, icon: ESPACE_META[id].icon, to: ESPACE_META[id].route,
        }))
      : [{ label: 'Explorer', icon: Compass, to: '/explorer' }]),
    { label: 'Messages', icon: MessageCircle, to: '/messages', badge: nonLus },
    { label: 'Notifications', icon: Bell, to: '/notifications', badge: nonLues },
    { label: 'Favoris', icon: Heart, to: '/favoris' },
  ];

  // Petite pastille de mesure (icône + valeur) réutilisée dans les consoles pro.
  const Pastille = ({ icon: Icone, valeur, libelle }: { icon: LucideIcon; valeur: string; libelle: string }) => (
    <div className="glass-light rounded-xl px-3 py-2 min-w-0">
      <p className="flex items-center gap-1.5 text-sm font-bold text-ink leading-none">
        <Icone className="w-3.5 h-3.5 text-ink-3 flex-shrink-0" strokeWidth={2.2} />
        <span className="truncate">{valeur}</span>
      </p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-ink-3 mt-1 truncate">{libelle}</p>
    </div>
  );

  return (
    <div className="pb-8 animate-fade-in space-y-6">

      {/* ─── HERO : monogramme + salutation + raccourcis profil ─── */}
      <section className="glass-elevated rounded-3xl p-5 sm:p-7 relative overflow-hidden animate-slide-up">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(10,132,255,0.14), transparent 70%)' }} aria-hidden="true" />
        <div className="absolute -bottom-28 -left-20 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(48,214,196,0.12), transparent 70%)' }} aria-hidden="true" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* Monogramme du membre (photo réelle si présente) */}
              <div
                className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden text-primary font-bold text-xl"
                style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.14), rgba(94,92,230,0.14))', boxShadow: 'var(--glass-specular)' }}
                aria-hidden="true"
              >
                {user?.photo ? <img src={user.photo} alt="" className="w-full h-full object-cover" /> : (user?.prenom?.charAt(0) || 'U')}
              </div>
              <div className="min-w-0">
                <div className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-1 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" strokeWidth={2.2} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-2">{dateDuJour}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight leading-tight">
                  {salutation}, <span className="text-primary">{user?.prenom || 'Membre'}</span> 👋
                </h1>
                <p className="text-sm text-ink-2 mt-0.5">Voici ce qui se passe sur ProxiConnect aujourd'hui.</p>
              </div>
            </div>

            <Link to="/deposer" className="btn-liquid-primary hidden sm:inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm no-underline flex-shrink-0">
              <Plus className="w-4 h-4" strokeWidth={2.2} /> Déposer une annonce
            </Link>
          </div>

          {/* Raccourcis rapides — pilules défilables sur mobile */}
          <div className="mt-5 flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-0.5">
            {raccourcisRapides.map((r) => (
              <Link
                key={`raccourci-${r.to}`}
                to={r.to}
                className="glass-pill shrink-0 inline-flex items-center gap-2 rounded-full px-3.5 py-2 no-underline hover:-translate-y-0.5 transition-transform duration-200"
              >
                <r.icon className="w-4 h-4 text-primary" strokeWidth={2.2} />
                <span className="text-xs font-semibold text-ink-2 whitespace-nowrap">{r.label}</span>
                {r.badge ? (
                  <span
                    className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    {r.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─=== PANNEAU "AUJOURD'HUI" : l'activité du membre dans un seul
           bloc de verre — la jauge d'annonces domine, les compteurs
           secondaires s'alignent à côté (pas de "4 cartes stats" plates). ─── */}
      <section className="glass rounded-3xl p-4 sm:p-5 animate-slide-up" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-3">Votre activité aujourd'hui</h2>
          <Link to="/profil" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 flex-shrink-0">
            Mon profil <ArrowUpRight className="w-3 h-3" strokeWidth={2.2} />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {loading ? (
            <>
              <div className="col-span-2"><Skeleton className="h-[104px] rounded-2xl" /></div>
              <Skeleton className="h-[104px] rounded-2xl" />
              <Skeleton className="h-[104px] rounded-2xl" />
            </>
          ) : (
            <>
              {/* Annonces : cellule principale avec jauge de quota réelle */}
              <Link to="/profil?onglet=annonces" className="col-span-2 no-underline">
                <div className="glass-light rounded-2xl p-4 h-full hover:-translate-y-0.5 transition-transform duration-200">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)' }}>
                        <LayoutGrid className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Mes annonces</p>
                        <p className="text-2xl font-bold text-ink leading-tight">
                          {quota.utilisees}
                          <span className="text-base font-semibold text-ink-3">/{quota.autorisees}</span>
                        </p>
                      </div>
                    </div>
                    {quotaDisponible && (
                      <Badge tone="primary" size="sm" className="flex-shrink-0">
                        {quotaRestant} restant{quotaRestant > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={pourcentageQuota} aria-valuemin={0} aria-valuemax={100} aria-label="Quota d'annonces utilisé">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pourcentageQuota}%`, background: 'var(--gradient-primary)' }} />
                  </div>
                </div>
              </Link>

              {/* Messages non lus */}
              <Link to="/messages" className="no-underline">
                <div className="glass-light rounded-2xl p-4 h-full hover:-translate-y-0.5 transition-transform duration-200">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #30D6C4 0%, #0EA5E9 100%)' }}>
                      <MessageCircle className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
                    </div>
                    {nonLus > 0 && <Badge tone="danger" size="sm">{nonLus}</Badge>}
                  </div>
                  <p className="text-2xl font-bold text-ink mt-2.5 leading-none">{nonLus}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-ink-3 mt-1.5 truncate">Messages non lus</p>
                </div>
              </Link>

              {/* Notifications non lues */}
              <Link to="/notifications" className="no-underline">
                <div className="glass-light rounded-2xl p-4 h-full hover:-translate-y-0.5 transition-transform duration-200">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)' }}>
                      <Bell className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
                    </div>
                    {nonLues > 0 && <Badge tone="warning" size="sm">{nonLues}</Badge>}
                  </div>
                  <p className="text-2xl font-bold text-ink mt-2.5 leading-none">{nonLues}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-ink-3 mt-1.5 truncate">Notifications</p>
                </div>
              </Link>

              {/* Favoris : cellule fine pleine largeur sous la grille sur mobile */}
              <Link to="/favoris" className="col-span-2 lg:col-span-4 no-underline">
                <div className="glass-light rounded-2xl px-4 py-3 flex items-center gap-3.5 hover:-translate-y-0.5 transition-transform duration-200">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #FB7185 0%, #F43F5E 100%)' }}>
                    <Heart className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink leading-tight">
                      {favoris.length} favori{favoris.length > 1 ? 's' : ''}
                      <span className="text-xs font-medium text-ink-3 ml-2">Retrouvez vos annonces sauvegardées</span>
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-ink-3 flex-shrink-0" strokeWidth={2.2} />
                </div>
              </Link>
            </>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Colonne principale ─── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ─=== CONSOLES PRO : un widget dédié par espace ACTIF, alimenté
                par les vraies données métier. Vue consolidée si plusieurs
                espaces, invitation à activer si aucun. ─── */}
          <section className="animate-slide-up" style={{ animationDelay: '120ms' }}>
            <div className="flex items-center justify-between gap-3 mb-3.5">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-3 whitespace-nowrap">Mes espaces professionnels</h2>
                {espacesActifsListe.length > 1 && (
                  <span className="glass-pill rounded-full px-2.5 py-1 text-[10px] font-bold text-primary whitespace-nowrap">
                    Vue consolidée · {espacesActifsListe.length}
                  </span>
                )}
              </div>
              <Link to="/mon-espace" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 flex-shrink-0">
                Gérer <ArrowRight className="w-3 h-3" strokeWidth={2.2} />
              </Link>
            </div>

            {chargementEspaces ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Skeleton className="h-40 rounded-2xl" count={2} />
              </div>
            ) : espacesActifsListe.length === 0 ? (
              <div className="glass-elevated rounded-3xl p-5 sm:p-6 relative overflow-hidden">
                <div className="absolute -top-16 -right-12 w-52 h-52 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(10,132,255,0.12), transparent 70%)' }} aria-hidden="true" />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--gradient-primary)' }}>
                    <Compass className="w-6 h-6 text-white" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-ink">Développez votre activité</h3>
                    <p className="text-sm text-ink-2 mt-1 max-w-lg">
                      Créez une boutique, un restaurant, un hôtel ou un profil livreur pour développer votre activité.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(Object.keys(ESPACE_META) as EspaceId[]).map((id) => {
                        const meta = ESPACE_META[id];
                        return (
                          <span key={id} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold text-ink-2">
                            <meta.icon className="w-3 h-3 text-primary" strokeWidth={2.2} />
                            {meta.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <Link to="/mon-espace" className="btn-liquid-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm no-underline flex-shrink-0 self-start">
                    Activer un espace <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {espacesActifsListe.map((id) => {
                  const meta = ESPACE_META[id];
                  const nomReel = nomsEspaces[id];
                  return (
                    <Link key={id} to={meta.route} className="no-underline block">
                      <div className="glass rounded-2xl p-4 sm:p-5 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
                        <div
                          className="absolute -top-12 -right-10 w-40 h-40 rounded-full pointer-events-none"
                          style={{ background: `radial-gradient(circle, ${meta.halo}, transparent 70%)` }}
                          aria-hidden="true"
                        />
                        <div className="relative">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: meta.gradient }}>
                              <meta.icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-ink truncate">{nomReel || meta.label}</p>
                              <p className="text-xs text-ink-3 truncate">{POINTS_ENTREE[id]}</p>
                            </div>
                            <span className="btn-liquid-ghost inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] flex-shrink-0">
                              Ouvrir <ArrowRight className="w-3 h-3" strokeWidth={2.2} />
                            </span>
                          </div>

                          {/* Mesures réelles de la console (chargées uniquement
                              pour les espaces actifs) */}
                          {chargementPro ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                              <Skeleton className="h-[52px] rounded-xl" count={3} />
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                              {id === 'vente' && (
                                <>
                                  <Pastille icon={ClipboardList} valeur={String(metriquesVente.enAttente)} libelle="À traiter" />
                                  <Pastille icon={CheckCircle2} valeur={String(metriquesVente.validees)} libelle="Commandes validées" />
                                  <Pastille icon={Banknote} valeur={formatXOF(metriquesVente.ventes)} libelle="Ventes cumulées" />
                                </>
                              )}
                              {id === 'restauration' && (
                                <>
                                  <Pastille icon={ClipboardList} valeur={String(metriquesRestaurant.enAttente)} libelle="À traiter" />
                                  <Pastille icon={UtensilsCrossed} valeur={String(metriquesRestaurant.enPreparation)} libelle="En préparation" />
                                  <Pastille icon={Banknote} valeur={formatXOF(metriquesRestaurant.revenus)} libelle="Revenus" />
                                </>
                              )}
                              {id === 'hotel' && (
                                <>
                                  <Pastille icon={CalendarCheck2} valeur={String(metriquesHotel.enAttente)} libelle="Résa à confirmer" />
                                  <Pastille icon={TrendingUp} valeur={`${metriquesHotel.occupation} %`} libelle={`Occupation · ${metriquesHotel.chambresTotal} ch.`} />
                                  <Pastille icon={Building2} valeur={String(metriquesHotel.chambresTotal)} libelle="Chambres" />
                                </>
                              )}
                              {id === 'livraison' && (
                                <>
                                  <Pastille icon={Bike} valeur={String(metriquesLivraison.terminees)} libelle="Livraisons faites" />
                                  <Pastille icon={Banknote} valeur={formatXOF(metriquesLivraison.revenus)} libelle="Revenus" />
                                  <Pastille
                                    icon={Star}
                                    valeur={metriquesLivraison.note !== null ? metriquesLivraison.note.toFixed(1) : '—'}
                                    libelle={metriquesLivraison.evaluations > 0 ? `${metriquesLivraison.evaluations} avis` : 'Pas encore noté'}
                                  />
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Mes annonces récentes */}
          <section className="animate-slide-up" style={{ animationDelay: '180ms' }}>
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-3">Mes annonces récentes</h2>
              <Link to="/profil?onglet=annonces" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" strokeWidth={2.2} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2.5">
                <Skeleton className="h-16 rounded-2xl" count={3} />
              </div>
            ) : mesAnnonces.length === 0 ? (
              <Card variant="glass-light">
                <EmptyState
                  icon={LayoutGrid}
                  title="Vous n'avez pas encore publié d'annonce"
                  action={
                    <Link to="/deposer" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                      Déposer une annonce <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                    </Link>
                  }
                />
              </Card>
            ) : (
              <div className="space-y-2.5">
                {mesAnnonces.slice(0, 4).map((a) => (
                  <Link key={a._id} to={`/annonces/${a._id}`} className="no-underline">
                    <Card variant="glass" interactive padding="sm" className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.10), rgba(94,92,230,0.10))' }}
                      >
                        {a.photos?.[0] ? (
                          <img src={a.photos[0]} alt={a.titre} className="w-full h-full object-cover" />
                        ) : (
                          <LayoutGrid className="w-4 h-4 text-ink-3" strokeWidth={2.2} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink truncate">{a.titre}</p>
                        <p className="text-xs text-ink-3 flex items-center gap-1 mt-0.5">
                          <Eye className="w-3 h-3" strokeWidth={2.2} />
                          {a.nombreVues} vue{a.nombreVues > 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge tone={a.statut === 'actif' ? 'success' : 'neutral'} size="sm">{a.statut}</Badge>
                    </Card>
                  </Link>
                ))}
                {quotaDisponible && (
                  <Link to="/deposer" className="btn-liquid-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm no-underline">
                    <Plus className="w-4 h-4" strokeWidth={2.2} /> Déposer une annonce
                    <span className="text-[11px] font-medium opacity-80">
                      · {quotaRestant} restant{quotaRestant > 1 ? 's' : ''}
                    </span>
                  </Link>
                )}
              </div>
            )}
          </section>
        </div>

        {/* ─── Colonne latérale ─── */}
        <div className="space-y-6">
          {/* Abonnement */}
          <Card variant="glass-solid" padding="lg" className="animate-slide-up relative overflow-hidden" style={{ animationDelay: '120ms' }}>
            <div className="absolute -top-12 -right-8 w-36 h-36 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.16), transparent 70%)' }} aria-hidden="true" />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)' }}>
                  <Crown className="w-4 h-4 text-white" strokeWidth={2.2} />
                </div>
                <h3 className="text-sm font-bold text-ink">Abonnement</h3>
              </div>
              {loading ? (
                <Skeleton className="h-10 rounded-xl" />
              ) : abonnement?.estAbonne ? (
                <>
                  <p className="text-sm text-ink-2 mb-3">
                    Offre active — <span className="font-semibold text-ink">{abonnement.joursRestants ?? 0} jour{(abonnement.joursRestants ?? 0) > 1 ? 's' : ''}</span> restant{(abonnement.joursRestants ?? 0) > 1 ? 's' : ''}.
                  </p>
                  <Link to="/abonnements" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    Gérer mon abonnement <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm text-ink-2 mb-3">Passez à une offre premium pour publier plus d'annonces et gagner en visibilité.</p>
                  <Link to="/abonnements" className="btn-liquid-primary inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs no-underline">
                    Découvrir les offres <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                  </Link>
                </>
              )}
            </div>
          </Card>

          {/* Activité récente */}
          <section className="animate-slide-up" style={{ animationDelay: '180ms' }}>
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-3">Activité récente</h2>
              <Link to="/notifications" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" strokeWidth={2.2} />
              </Link>
            </div>
            <Card variant="glass" padding="none" className="overflow-hidden">
              {loading ? (
                <div className="p-4"><Skeleton className="h-12 rounded-xl" count={3} /></div>
              ) : notifications.length === 0 ? (
                <EmptyState icon={Bell} title="Aucune activité récente" />
              ) : (
                <ul className="divide-y divide-slate-200/60" role="list">
                  {notifications.map((n) => {
                    const Icone = ICONES_NOTIF[n.type] || Bell;
                    return (
                      <li key={n._id}>
                        <Link to={n.lien || '/notifications'} className="flex items-start gap-3 px-4 py-3 no-underline hover:bg-black/[0.04] transition-colors">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.lu ? 'glass-light' : ''}`}
                            style={n.lu ? undefined : { background: 'var(--gradient-primary)' }}
                          >
                            <Icone className={`w-3.5 h-3.5 ${n.lu ? 'text-ink-3' : 'text-white'}`} strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs truncate ${n.lu ? 'text-ink-2' : 'font-semibold text-ink'}`}>{n.titre}</p>
                            <p className="text-[11px] text-ink-3 mt-0.5">{tempsEcoule(n.createdAt)}</p>
                          </div>
                          {!n.lu && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
