import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, AlertCircle, ChevronRight, Search } from 'lucide-react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Card, Avatar, EmptyState, Skeleton, Badge, Input } from '../../components/ui';

interface Participant { _id: string; nom: string; prenom: string; photo?: string; }
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
  const { user } = useAuth();
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

  return (
    <div className="max-w-2xl mx-auto pb-24 animate-fade-in">
      <Card padding="none" className="overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b border-white/40 space-y-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#007AFF]" aria-hidden="true" />
            <h1 className="text-base font-semibold text-slate-800">Messages</h1>
          </div>
          {!loading && !erreur && conversations.length > 0 && (
            <Input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une conversation..."
              icon={<Search className="w-4 h-4" />}
            />
          )}
        </div>

        {loading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-16 rounded-2xl" count={4} />
          </div>
        ) : erreur ? (
          <p className="text-sm text-red-500 flex items-center gap-1.5 py-12 justify-center"><AlertCircle className="w-4 h-4" aria-hidden="true" />Impossible de charger vos messages.</p>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Aucune conversation pour le moment"
            description="Contactez un vendeur, un restaurateur ou un livreur depuis sa page pour démarrer une discussion."
          />
        ) : conversationsFiltrees.length === 0 ? (
          <EmptyState icon={Search} title="Aucune conversation ne correspond à cette recherche." />
        ) : (
          <ul className="divide-y divide-white/40" role="list">
            {conversationsFiltrees.map((c) => {
              const autre = c.participants.find((p) => p._id !== user?._id) || c.participants[0];
              const nomComplet = autre ? `${autre.prenom} ${autre.nom}` : 'Utilisateur';
              return (
                <li key={c._id}>
                  <Link
                    to={`/messages/${c._id}`}
                    className="flex items-center gap-3 px-5 py-3.5 no-underline hover:bg-white/50 transition-colors focus-visible:bg-white/50"
                    aria-label={`Conversation avec ${nomComplet}${c.nonLus > 0 ? `, ${c.nonLus} message${c.nonLus > 1 ? 's' : ''} non lu${c.nonLus > 1 ? 's' : ''}` : ''}`}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar photo={autre?.photo} prenom={autre?.prenom} nom={autre?.nom} />
                      {c.nonLus > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#007AFF] border-2 border-white" aria-hidden="true" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${c.nonLus > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>{nomComplet}</p>
                        <span className="text-[11px] text-slate-400 flex-shrink-0">{tempsCourt(c.derniereActivite)}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${c.nonLus > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{c.dernierMessage || 'Nouvelle conversation'}</p>
                    </div>
                    {c.nonLus > 0 ? (
                      <Badge tone="primary" className="!bg-[#007AFF] !text-white min-w-[20px] justify-center flex-shrink-0">{c.nonLus}</Badge>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" aria-hidden="true" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default Conversations;
