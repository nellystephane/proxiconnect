import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, AlertCircle, ChevronRight } from 'lucide-react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

interface Participant { _id: string; nom: string; prenom: string; photo?: string; }
interface ConversationApercu {
  _id: string;
  participants: Participant[];
  dernierMessage: string;
  derniereActivite: string;
  nonLus: number;
}

const initiales = (p?: Participant) => (p ? `${p.prenom?.[0] || ''}${p.nom?.[0] || ''}` : '?');

const tempsCourt = (date: string) => {
  const d = new Date(date);
  const aujourdHui = new Date();
  const memeJour = d.toDateString() === aujourdHui.toDateString();
  if (memeJour) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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

  useEffect(() => {
    API.get('/conversations')
      .then(({ data }) => setConversations(data))
      .catch(() => setErreur(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { rafraichirNonLus(); }, [rafraichirNonLus]);

  return (
    <div className="max-w-2xl mx-auto pb-24 animate-fade-in">
      <div className="glass rounded-3xl shadow-lg overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/40">
          <MessageCircle className="w-4 h-4 text-[#007AFF]" />
          <h1 className="text-base font-semibold text-slate-800">Messages</h1>
        </div>

        {loading ? (
          <div className="p-4 space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-slate-100/70 animate-pulse" />)}
          </div>
        ) : erreur ? (
          <p className="text-sm text-red-500 flex items-center gap-1.5 py-12 justify-center"><AlertCircle className="w-4 h-4" />Impossible de charger vos messages.</p>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-[#007AFF]" />
            </div>
            <p className="text-slate-500 font-medium text-sm">Aucune conversation pour le moment.</p>
            <p className="text-xs text-slate-400 max-w-[220px]">Contactez un vendeur, un restaurateur ou un livreur depuis sa page pour démarrer une discussion.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/40">
            {conversations.map((c) => {
              const autre = c.participants.find((p) => p._id !== user?._id) || c.participants[0];
              return (
                <Link
                  key={c._id}
                  to={`/messages/${c._id}`}
                  className="flex items-center gap-3 px-5 py-3.5 no-underline hover:bg-white/50 transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center overflow-hidden ring-2 ring-white">
                      {autre?.photo ? <img src={autre.photo} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-[#007AFF]">{initiales(autre)}</span>}
                    </div>
                    {c.nonLus > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#007AFF] border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${c.nonLus > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>{autre ? `${autre.prenom} ${autre.nom}` : 'Utilisateur'}</p>
                      <span className="text-[11px] text-slate-400 flex-shrink-0">{tempsCourt(c.derniereActivite)}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${c.nonLus > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{c.dernierMessage || 'Nouvelle conversation'}</p>
                  </div>
                  {c.nonLus > 0 ? (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#007AFF] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">{c.nonLus}</span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;
