import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, MessageCircle, ShoppingBag, CalendarCheck, Bike, Star, Crown, AlertCircle, Check,
} from 'lucide-react';
import API from '../../api/axios';
import { Skeleton, EmptyState } from '../../components/ui';
import { useNotifications, type NotificationItem } from '../../context/NotificationContext';

const ICONES_TYPE: Record<string, React.ElementType> = {
  nouveau_message: MessageCircle,
  piece_jointe: MessageCircle,
  nouvelle_commande: ShoppingBag,
  statut_commande: ShoppingBag,
  nouvelle_reservation: CalendarCheck,
  statut_reservation: CalendarCheck,
  demande_livraison_acceptee: Bike,
  nouvelle_livraison: Bike,
  statut_livraison: Bike,
  demande_evaluation: Star,
  nouvelle_evaluation_livreur: Star,
  nouvel_avis: Star,
  paiement_confirme: Crown,
};

// ─── Catégories : simple regroupement des types déjà émis par le backend
// (aucune donnée nouvelle), pour permettre de filtrer le centre de
// notifications sans avoir à changer le modèle de données. ───
type Categorie = 'tout' | 'messages' | 'commandes' | 'reservations' | 'livraisons' | 'avis' | 'abonnement';

const CATEGORIE_PAR_TYPE: Record<string, Categorie> = {
  nouveau_message: 'messages',
  piece_jointe: 'messages',
  nouvelle_commande: 'commandes',
  statut_commande: 'commandes',
  nouvelle_reservation: 'reservations',
  statut_reservation: 'reservations',
  demande_livraison_acceptee: 'livraisons',
  nouvelle_livraison: 'livraisons',
  statut_livraison: 'livraisons',
  demande_evaluation: 'avis',
  nouvelle_evaluation_livreur: 'avis',
  nouvel_avis: 'avis',
  paiement_confirme: 'abonnement',
};

const CATEGORIES: { id: Categorie; label: string; icon: React.ElementType }[] = [
  { id: 'tout', label: 'Toutes', icon: Bell },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'commandes', label: 'Commandes', icon: ShoppingBag },
  { id: 'reservations', label: 'Réservations', icon: CalendarCheck },
  { id: 'livraisons', label: 'Livraisons', icon: Bike },
  { id: 'avis', label: 'Avis', icon: Star },
  { id: 'abonnement', label: 'Abonnement', icon: Crown },
];

// ─── Teinte de la pastille d'icône par catégorie (verres translucides
// teintés, lisibles en clair comme en sombre — aucune couleur pleine). ───
const TEINTE_CATEGORIE: Record<Categorie, string> = {
  tout: 'bg-slate-500/10 text-slate-500',
  messages: 'bg-blue-500/10 text-blue-500',
  commandes: 'bg-amber-500/10 text-amber-600',
  reservations: 'bg-violet-500/10 text-violet-500',
  livraisons: 'bg-teal-500/10 text-teal-600',
  avis: 'bg-amber-400/10 text-amber-500',
  abonnement: 'bg-emerald-500/10 text-emerald-600',
};

const tempsEcoule = (date: string) => {
  const secondes = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secondes < 60) return "à l'instant";
  const minutes = Math.floor(secondes / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  return `il y a ${jours} j`;
};

const Notifications = () => {
  const { reinitialiser } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(false);
  const [categorie, setCategorie] = useState<Categorie>('tout');
  const [seulementNonLues, setSeulementNonLues] = useState(false);

  useEffect(() => {
    API.get('/notifications')
      .then(({ data }) => setNotifications(data))
      .catch(() => setErreur(true))
      .finally(() => setLoading(false));
  }, []);

  const marquerToutesLues = async () => {
    try {
      await API.put('/notifications/lues');
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      reinitialiser();
    } catch {
      setErreur(true);
    }
  };

  const marquerLue = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, lu: true } : n)));
    try {
      await API.put(`/notifications/${id}/lue`);
    } catch {
      // Échec silencieux : ce n'est pas critique, la notification redeviendra visible au prochain chargement
    }
  };

  const nombreNonLues = notifications.filter((n) => !n.lu).length;

  const compteParCategorie = useMemo(() => {
    const compte: Record<Categorie, number> = { tout: notifications.length, messages: 0, commandes: 0, reservations: 0, livraisons: 0, avis: 0, abonnement: 0 };
    notifications.forEach((n) => {
      const cat = CATEGORIE_PAR_TYPE[n.type];
      if (cat) compte[cat]++;
    });
    return compte;
  }, [notifications]);

  const notificationsFiltrees = useMemo(() => {
    return notifications.filter((n) => {
      const matchCategorie = categorie === 'tout' || CATEGORIE_PAR_TYPE[n.type] === categorie;
      const matchLecture = !seulementNonLues || !n.lu;
      return matchCategorie && matchLecture;
    });
  }, [notifications, categorie, seulementNonLues]);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* ─── En-tête : titre + compteur non lus + action "tout lire" ─── */}
      <header className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="glass w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 leading-tight">Notifications</h1>
              {nombreNonLues > 0 && (
                <span
                  className="glass-pill rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  {nombreNonLues}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 truncate">Ce qui s'est passé récemment sur votre compte.</p>
          </div>
        </div>
        {nombreNonLues > 0 && (
          <button
            onClick={marquerToutesLues}
            className="glass-pill rounded-full px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-primary transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            <Check className="w-4 h-4" aria-hidden="true" /> Tout marquer comme lu
          </button>
        )}
      </header>

      {/* ─── Filtres : chips par catégorie (défilement horizontal mobile) +
          bascule "non lues uniquement" en pilule ─── */}
      {!loading && !erreur && notifications.length > 0 && (
        <div className="mb-5 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {CATEGORIES.filter((c) => c.id === 'tout' || compteParCategorie[c.id] > 0).map((c) => (
              <button
                key={c.id}
                onClick={() => setCategorie(c.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  categorie === c.id ? 'text-white' : 'glass-pill text-slate-600 hover:text-slate-900'
                }`}
                style={categorie === c.id ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow-primary)' } : undefined}
                aria-pressed={categorie === c.id}
              >
                <c.icon className="w-4 h-4" /> {c.label}
                {compteParCategorie[c.id] > 0 && <span className={categorie === c.id ? 'text-white/80' : 'text-slate-400'}>{compteParCategorie[c.id]}</span>}
              </button>
            ))}
          </div>
          <label className="glass-pill rounded-full pl-3 pr-3.5 py-1.5 flex items-center gap-2 text-xs text-slate-600 w-fit cursor-pointer">
            <input
              type="checkbox"
              checked={seulementNonLues}
              onChange={(e) => setSeulementNonLues(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-primary"
            />
            Afficher seulement les non lues {nombreNonLues > 0 && <span className="font-bold text-primary">({nombreNonLues})</span>}
          </label>
        </div>
      )}

      {/* ─── Liste / états de chargement, erreur et vides ─── */}
      {loading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-[76px] rounded-2xl" count={5} />
        </div>
      ) : erreur && notifications.length === 0 ? (
        <div className="glass rounded-3xl py-14 flex flex-col items-center justify-center gap-2 text-red-500">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          <p className="text-sm">Impossible de charger vos notifications.</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass rounded-3xl">
          <EmptyState icon={Bell} title="Aucune notification pour le moment." />
        </div>
      ) : notificationsFiltrees.length === 0 ? (
        <div className="glass rounded-3xl">
          <EmptyState
            icon={Bell}
            title="Aucune notification ne correspond à ce filtre."
            action={
              <button
                onClick={() => { setCategorie('tout'); setSeulementNonLues(false); }}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Réinitialiser les filtres
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {notificationsFiltrees.map((n) => {
            const Icone = ICONES_TYPE[n.type] || Bell;
            const categorieItem = CATEGORIE_PAR_TYPE[n.type] || 'tout';
            return (
              // ─── Élément : non lues sur verre surélevé, lues sur verre
              //     plat ; navigation conservée + marquage lu au clic. ───
              <Link
                key={n._id}
                to={n.lien || '#'}
                onClick={() => !n.lu && marquerLue(n._id)}
                className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl no-underline transition-all duration-200 hover:-translate-y-0.5 ${n.lu ? 'glass' : 'glass-elevated'}`}
              >
                {/* Pastille d'icône teintée par catégorie + point non lu */}
                <div className="relative flex-shrink-0 mt-0.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${TEINTE_CATEGORIE[categorieItem]}`}>
                    <Icone className="w-[18px] h-[18px]" aria-hidden="true" />
                  </div>
                  {!n.lu && (
                    <span
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white/80"
                      style={{ background: 'var(--gradient-primary)' }}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Contenu : titre, description, temps relatif */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.lu ? 'text-slate-700 font-medium' : 'font-semibold text-slate-900'}`}>{n.titre}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{tempsEcoule(n.createdAt)}</p>
                </div>

                {/* Action "marquer lu" sans naviguer (handler existant) */}
                {!n.lu && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); marquerLue(n._id); }}
                    className="glass-control w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-primary transition-colors self-center flex-shrink-0"
                    aria-label="Marquer comme lue"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
