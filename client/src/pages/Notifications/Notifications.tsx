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
  nouvelle_commande: ShoppingBag,
  statut_commande: ShoppingBag,
  nouvelle_reservation: CalendarCheck,
  statut_reservation: CalendarCheck,
  demande_livraison_acceptee: Bike,
  statut_livraison: Bike,
  nouvel_avis: Star,
  paiement_confirme: Crown,
};

// ─── Catégories : simple regroupement des types déjà émis par le backend
// (aucune donnée nouvelle), pour permettre de filtrer le centre de
// notifications sans avoir à changer le modèle de données. ───
type Categorie = 'tout' | 'messages' | 'commandes' | 'reservations' | 'livraisons' | 'avis' | 'abonnement';

const CATEGORIE_PAR_TYPE: Record<string, Categorie> = {
  nouveau_message: 'messages',
  nouvelle_commande: 'commandes',
  statut_commande: 'commandes',
  nouvelle_reservation: 'reservations',
  statut_reservation: 'reservations',
  demande_livraison_acceptee: 'livraisons',
  statut_livraison: 'livraisons',
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
    <div className="max-w-2xl mx-auto pb-24 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Notifications</h1>
          <p className="text-sm text-slate-500">Ce qui s'est passé récemment sur votre compte.</p>
        </div>
        {nombreNonLues > 0 && (
          <button onClick={marquerToutesLues} className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1 flex-shrink-0">
            <Check className="w-3.5 h-3.5" /> Tout marquer comme lu
          </button>
        )}
      </div>

      {!loading && !erreur && notifications.length > 0 && (
        <div className="mb-5 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.filter((c) => c.id === 'tout' || compteParCategorie[c.id] > 0).map((c) => (
              <button
                key={c.id}
                onClick={() => setCategorie(c.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  categorie === c.id ? 'bg-[#007AFF] text-white shadow-sm shadow-blue-500/25' : 'glass-light text-slate-600 hover:bg-blue-50/50'
                }`}
              >
                <c.icon className="w-3.5 h-3.5" /> {c.label}
                {compteParCategorie[c.id] > 0 && <span className={categorie === c.id ? 'text-white/80' : 'text-slate-400'}>{compteParCategorie[c.id]}</span>}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-500 w-fit cursor-pointer">
            <input
              type="checkbox"
              checked={seulementNonLues}
              onChange={(e) => setSeulementNonLues(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-[#007AFF]"
            />
            Afficher seulement les non lues {nombreNonLues > 0 && `(${nombreNonLues})`}
          </label>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-2xl" count={5} />
        </div>
      ) : erreur && notifications.length === 0 ? (
        <p className="text-sm text-red-500 flex items-center gap-1.5 py-10 justify-center"><AlertCircle className="w-4 h-4" />Impossible de charger vos notifications.</p>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Aucune notification pour le moment." />
      ) : notificationsFiltrees.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Aucune notification ne correspond à ce filtre."
          action={
            <button
              onClick={() => { setCategorie('tout'); setSeulementNonLues(false); }}
              className="text-sm font-semibold text-[#007AFF] hover:underline"
            >
              Réinitialiser les filtres
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {notificationsFiltrees.map((n) => {
            const Icone = ICONES_TYPE[n.type] || Bell;
            return (
              <Link
                key={n._id}
                to={n.lien || '#'}
                onClick={() => !n.lu && marquerLue(n._id)}
                className={`flex items-start gap-3 p-4 rounded-2xl no-underline transition-all duration-200 ${n.lu ? 'glass' : 'bg-blue-50 border border-blue-100'}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${n.lu ? 'bg-slate-100 text-slate-400' : 'bg-[#007AFF] text-white'}`}>
                  <Icone className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.lu ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>{n.titre}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{tempsEcoule(n.createdAt)}</p>
                </div>
                {!n.lu && <span className="w-2 h-2 rounded-full bg-[#007AFF] flex-shrink-0 mt-1.5" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
