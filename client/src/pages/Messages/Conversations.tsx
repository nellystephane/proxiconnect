import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, AlertCircle, ChevronRight, Search, X } from 'lucide-react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { getSocket } from '../../api/socket';
import { Avatar, EmptyState, Skeleton } from '../../components/ui';
import { libellePresence, PointPresence } from '../../utils/presence';

interface Participant { _id: string; nom: string; prenom: string; photo?: string; enLigne?: boolean; dernierActivite?: string | null; }
interface ConversationApercu {
  _id: string;
  participants: Participant[];
  dernierMessage: string;
  derniereActivite: string;
  nonLus: number;
}

const tempsCourt = (date: string) => {
  const d = new Date(date);
  const aujourdHui = new Date();
  if (d.toDateString() === aujourdHui.toDateString()) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const hier = new Date(aujourdHui);
  hier.setDate(hier.getDate() - 1);
  if (d.toDateString() === hier.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

const Conversations = () => {
  const { user, token } = useAuth();
  const { rafraichirNonLus } = useChat();
  const [conversations, setConversations] = useState<ConversationApercu[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(false);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    API.get('/conversations')
      .then(({ data }) => setConversations(data))
      .catch(() => setErreur(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { rafraichirNonLus(); }, [rafraichirNonLus]);

  // ─── Présence en direct : met à jour le petit point vert de chaque
  // conversation sans re-charger la liste entière. ───
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    const surPresence = ({ userId, enLigne, dernierActivite }: { userId: string; enLigne: boolean; dernierActivite: string | null }) => {
      setConversations((prev) => prev.map((c) => ({
        ...c,
        participants: c.participants.map((p) => (p._id === userId ? { ...p, enLigne, dernierActivite } : p)),
      })));
    };
    socket.on('presence:maj', surPresence);
    return () => { socket.off('presence:maj', surPresence); };
  }, [token]);

  // Filtrage purement client, sur les conversations déjà chargées (aucun
  // nouvel appel réseau) : par nom du correspondant ou aperçu du dernier message.
  const conversationsFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const autre = c.participants.find((p) => p._id !== user?._id) || c.participants[0];
      const nom = autre ? `${autre.prenom} ${autre.nom}`.toLowerCase() : '';
      return nom.includes(q) || (c.dernierMessage || '').toLowerCase().includes(q);
    });
  }, [conversations, recherche, user?._id]);

  // Total non lus : simple dérivation d'affichage pour le résumé d'en-tête.
  const totalNonLus = useMemo(() => conversations.reduce((somme, c) => somme + c.nonLus, 0), [conversations]);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* ─── En-tête de page : titre + résumé des non lus en pilule dégradée ─── */}
      <header className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="glass w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Messages</h1>
            <p className="text-sm text-slate-500 truncate">Vos conversations en cours.</p>
          </div>
        </div>
        {totalNonLus > 0 && (
          <span
            className="glass-pill rounded-full px-3 py-1.5 text-[11px] font-bold text-white flex-shrink-0"
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow-primary)' }}
          >
            {totalNonLus} non lu{totalNonLus > 1 ? 's' : ''}
          </span>
        )}
      </header>

      {/* ─── Panneau liste : une seule surface de verre, recherche en pilule ─── */}
      <div className="glass rounded-3xl overflow-hidden shadow-lg">
        {!loading && !erreur && conversations.length > 0 && (
          <div className="p-3 border-b border-slate-200/60">
            <div className="glass-pill rounded-full h-11 flex items-center gap-2.5 px-4">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
              <label htmlFor="recherche-conversations" className="sr-only">Rechercher une conversation</label>
              <input
                id="recherche-conversations"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher une conversation..."
                className="flex-1 min-w-0 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
              />
              {recherche && (
                <button
                  type="button"
                  onClick={() => setRecherche('')}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                  aria-label="Effacer la recherche"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-4 space-y-2.5">
            <Skeleton className="h-[74px] rounded-2xl" count={5} />
          </div>
        ) : erreur ? (
          <div className="py-14 flex flex-col items-center justify-center gap-2 text-red-500">
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
            <p className="text-sm">Impossible de charger vos messages.</p>
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Aucune conversation pour le moment"
            description="Contactez un vendeur, un restaurateur ou un livreur depuis sa page pour démarrer une discussion."
          />
        ) : conversationsFiltrees.length === 0 ? (
          <EmptyState icon={Search} title="Aucune conversation ne correspond à cette recherche." />
        ) : (
          <ul className="divide-y divide-slate-200/60" role="list">
            {conversationsFiltrees.map((c) => {
              const autre = c.participants.find((p) => p._id !== user?._id) || c.participants[0];
              const nomComplet = autre ? `${autre.prenom} ${autre.nom}` : 'Utilisateur';
              return (
                <li key={c._id}>
                  <Link
                    to={`/messages/${c._id}`}
                    className="flex items-center gap-3.5 px-4 py-3.5 no-underline transition-colors duration-200 hover:bg-white/50 focus-visible:bg-white/50"
                    aria-label={`Conversation avec ${nomComplet}${c.nonLus > 0 ? `, ${c.nonLus} message${c.nonLus > 1 ? 's' : ''} non lu${c.nonLus > 1 ? 's' : ''}` : ''}`}
                  >
                    {/* Avatar + point de présence en overlay */}
                    <div className="relative flex-shrink-0">
                      <Avatar photo={autre?.photo} prenom={autre?.prenom} nom={autre?.nom} />
                      <PointPresence enLigne={autre?.enLigne} className="absolute -bottom-0.5 -right-0.5" />
                    </div>

                    {/* Nom + horodatage relatif, aperçu du dernier message, présence */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`text-sm truncate ${c.nonLus > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>{nomComplet}</p>
                        <span className="text-[11px] text-slate-400 flex-shrink-0">{tempsCourt(c.derniereActivite)}</span>
                      </div>
                      <p className={`text-[13px] truncate mt-0.5 ${c.nonLus > 0 ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                        {c.dernierMessage || 'Nouvelle conversation'}
                      </p>
                      {autre?.enLigne ? (
                        <p className="text-[11px] mt-1 flex items-center gap-1.5 text-emerald-500 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                          En ligne
                        </p>
                      ) : autre?.dernierActivite ? (
                        <p className="text-[11px] mt-1 text-slate-400">{libellePresence(false, autre.dernierActivite)}</p>
                      ) : null}
                    </div>

                    {/* Compteur de non lus en pilule dégradée, ou flèche discrète */}
                    {c.nonLus > 0 ? (
                      <span
                        className="rounded-full min-w-[22px] h-[22px] px-1.5 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                        style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow-primary)' }}
                        aria-hidden="true"
                      >
                        {c.nonLus}
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" aria-hidden="true" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Conversations;
