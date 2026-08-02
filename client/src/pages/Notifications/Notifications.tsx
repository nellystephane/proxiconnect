import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, MessageCircle, ShoppingBag, CalendarCheck, Bike, Star, Crown, AlertCircle, Check
} from 'lucide-react';
import API from '../../api/axios';
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

  return (
    <div className="max-w-2xl mx-auto pb-24 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Notifications</h1>
          <p className="text-sm text-slate-500">Ce qui s'est passé récemment sur votre compte.</p>
        </div>
        {nombreNonLues > 0 && (
          <button onClick={marquerToutesLues} className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Tout marquer comme lu
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : erreur && notifications.length === 0 ? (
        <p className="text-sm text-red-500 flex items-center gap-1.5 py-10 justify-center"><AlertCircle className="w-4 h-4" />Impossible de charger vos notifications.</p>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <Bell className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">Aucune notification pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icone = ICONES_TYPE[n.type] || Bell;
            return (
              <Link
                key={n._id}
                to={n.lien || '#'}
                onClick={() => !n.lu && marquerLue(n._id)}
                className={`flex items-start gap-3 p-4 rounded-2xl no-underline transition-all ${n.lu ? 'glass' : 'bg-blue-50 border border-blue-100'}`}
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
