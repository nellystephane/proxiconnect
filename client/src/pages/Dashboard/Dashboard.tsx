import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutGrid, Heart, MessageCircle, Bell, Crown, ArrowRight, Plus,
  Store, UtensilsCrossed, Building2, Bike, Compass, User, Sparkles,
} from 'lucide-react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { useChat } from '../../context/ChatContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card, Badge, Skeleton, EmptyState } from '../../components/ui';
import type { Annonce, AbonnementStatut } from '../../types';
import type { NotificationItem } from '../../context/NotificationContext';

const ESPACE_META = {
  vente: { label: 'Ma boutique', icon: Store, route: '/vente', couleur: '#007AFF' },
  restauration: { label: 'Mon restaurant', icon: UtensilsCrossed, route: '/restauration', couleur: '#f59e0b' },
  hotel: { label: 'Mon hôtel', icon: Building2, route: '/hotel', couleur: '#a855f7' },
  livraison: { label: 'Livraison', icon: Bike, route: '/livraison', couleur: '#22c55e' },
} as const;

const ICONES_NOTIF: Record<string, React.ElementType> = {
  nouveau_message: MessageCircle,
  nouvelle_commande: Store,
  statut_commande: Store,
  nouvelle_reservation: Building2,
  statut_reservation: Building2,
  demande_livraison_acceptee: Bike,
  statut_livraison: Bike,
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

const Dashboard = () => {
  const { user } = useAuth();
  const { espacesActifs, chargement: chargementEspaces } = usePlatform();
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

  const espacesActifsListe = (Object.keys(ESPACE_META) as (keyof typeof ESPACE_META)[]).filter((id) => espacesActifs[id]);

  const heureDuJour = new Date().getHours();
  const salutation = heureDuJour < 12 ? 'Bonjour' : heureDuJour < 18 ? 'Bon après-midi' : 'Bonsoir';

  const STAT_CARDS = [
    { label: 'Mes annonces', valeur: `${quota.utilisees}/${quota.autorisees}`, icon: LayoutGrid, to: '/profil?onglet=annonces', couleur: '#007AFF' },
    { label: 'Favoris', valeur: favoris.length, icon: Heart, to: '/favoris', couleur: '#f43f5e' },
    { label: 'Messages non lus', valeur: nonLus, icon: MessageCircle, to: '/messages', couleur: '#30D6C4' },
    { label: 'Notifications non lues', valeur: nonLues, icon: Bell, to: '/notifications', couleur: '#f59e0b' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* En-tête */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-[#007AFF] mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Tableau de bord</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {salutation}, <span className="text-[#007AFF]">{user?.prenom || 'Membre'}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Voici un aperçu de votre activité sur ProxiConnect.</p>
        </div>
        <Link to="/deposer" className="btn-liquid-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm no-underline">
          <Plus className="w-4 h-4" /> Déposer une annonce
        </Link>
      </header>

      {/* Cartes de statistiques */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          <Skeleton className="h-24 rounded-2xl" count={4} />
        ) : (
          STAT_CARDS.map((stat) => (
            <Link key={stat.label} to={stat.to} className="no-underline">
              <Card variant="glass" interactive>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${stat.couleur}1A`, color: stat.couleur }}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-slate-900 truncate">{stat.valeur}</p>
                    <p className="text-xs text-slate-500 truncate">{stat.label}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mes espaces pro */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800">Mes espaces professionnels</h2>
              <Link to="/mon-espace" className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1">
                Gérer <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {chargementEspaces ? (
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-20 rounded-2xl" count={2} />
              </div>
            ) : espacesActifsListe.length === 0 ? (
              <Card variant="glass-light">
                <EmptyState
                  icon={Compass}
                  title="Aucun espace professionnel activé"
                  description="Créez une boutique, un restaurant, un hôtel ou un profil livreur pour développer votre activité."
                  action={
                    <Link to="/mon-espace" className="text-sm font-semibold text-[#007AFF] hover:underline flex items-center gap-1">
                      Découvrir les espaces <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  }
                />
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {espacesActifsListe.map((id) => {
                  const meta = ESPACE_META[id];
                  return (
                    <Link key={id} to={meta.route} className="no-underline">
                      <Card variant="glass" interactive>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${meta.couleur}1A`, color: meta.couleur }}>
                            <meta.icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{meta.label}</p>
                            <p className="text-xs text-slate-400">Gérer l'espace</p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Mes annonces récentes */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800">Mes annonces récentes</h2>
              <Link to="/profil?onglet=annonces" className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <Skeleton className="h-16 rounded-2xl" count={3} />
            ) : mesAnnonces.length === 0 ? (
              <Card variant="glass-light">
                <EmptyState
                  icon={LayoutGrid}
                  title="Vous n'avez pas encore publié d'annonce"
                  action={
                    <Link to="/deposer" className="text-sm font-semibold text-[#007AFF] hover:underline flex items-center gap-1">
                      Déposer une annonce <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  }
                />
              </Card>
            ) : (
              <div className="space-y-2">
                {mesAnnonces.slice(0, 4).map((a) => (
                  <Link key={a._id} to={`/annonces/${a._id}`} className="no-underline">
                    <Card variant="glass" interactive padding="sm" className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        {a.photos?.[0] && <img src={a.photos[0]} alt={a.titre} className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{a.titre}</p>
                        <p className="text-xs text-slate-400">{a.nombreVues} vue{a.nombreVues > 1 ? 's' : ''}</p>
                      </div>
                      <Badge tone={a.statut === 'actif' ? 'success' : 'neutral'} size="sm">{a.statut}</Badge>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Abonnement */}
          <Card variant="glass-solid">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-900">Abonnement</h3>
            </div>
            {loading ? (
              <Skeleton className="h-10 rounded-xl" />
            ) : abonnement?.estAbonne ? (
              <>
                <p className="text-sm text-slate-600 mb-3">
                  Offre active — <span className="font-semibold text-slate-900">{abonnement.joursRestants ?? 0} jour{(abonnement.joursRestants ?? 0) > 1 ? 's' : ''}</span> restant{(abonnement.joursRestants ?? 0) > 1 ? 's' : ''}.
                </p>
                <Link to="/abonnements" className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1">
                  Gérer mon abonnement <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-3">Passez à une offre premium pour publier plus d'annonces et gagner en visibilité.</p>
                <Link to="/abonnements" className="btn-liquid-primary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs no-underline">
                  Découvrir les offres <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </Card>

          {/* Activité récente */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800">Activité récente</h2>
              <Link to="/notifications" className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <Card variant="glass" padding="none" className="overflow-hidden">
              {loading ? (
                <div className="p-4"><Skeleton className="h-12 rounded-xl" count={3} /></div>
              ) : notifications.length === 0 ? (
                <EmptyState icon={Bell} title="Aucune activité récente" />
              ) : (
                <ul className="divide-y divide-white/40" role="list">
                  {notifications.map((n) => {
                    const Icone = ICONES_NOTIF[n.type] || Bell;
                    return (
                      <li key={n._id}>
                        <Link to={n.lien || '/notifications'} className="flex items-start gap-3 px-4 py-3 no-underline hover:bg-white/50 transition-colors">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.lu ? 'glass-light text-slate-400' : 'bg-blue-50 text-[#007AFF]'}`}>
                            <Icone className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs truncate ${n.lu ? 'text-slate-500' : 'font-semibold text-slate-900'}`}>{n.titre}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{tempsEcoule(n.createdAt)}</p>
                          </div>
                          {!n.lu && <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] mt-1.5 flex-shrink-0" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          {/* Accès rapides */}
          <div>
            <h2 className="text-sm font-bold text-slate-800 mb-3">Accès rapides</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Explorer', icon: Compass, to: '/explorer' },
                { label: 'Messages', icon: MessageCircle, to: '/messages' },
                { label: 'Mon espace', icon: LayoutGrid, to: '/mon-espace' },
                { label: 'Profil', icon: User, to: '/profil' },
              ].map((raccourci) => (
                <Link key={raccourci.to} to={raccourci.to} className="no-underline">
                  <Card variant="glass-light" interactive padding="sm" className="!rounded-xl flex flex-col items-center gap-1.5 text-center">
                    <raccourci.icon className="w-4 h-4 text-[#007AFF]" />
                    <span className="text-xs font-medium text-slate-700">{raccourci.label}</span>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
