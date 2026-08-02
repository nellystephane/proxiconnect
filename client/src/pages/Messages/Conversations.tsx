import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, AlertCircle } from 'lucide-react';
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
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Messages</h1>
        <p className="text-sm text-slate-500">Vos échanges avec les autres membres de la plateforme.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : erreur ? (
        <p className="text-sm text-red-500 flex items-center gap-1.5 py-10 justify-center"><AlertCircle className="w-4 h-4" />Impossible de charger vos messages.</p>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">Aucune conversation pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => {
            const autre = c.participants.find((p) => p._id !== user?._id) || c.participants[0];
            return (
              <Link
                key={c._id}
                to={`/messages/${c._id}`}
                className="glass rounded-2xl p-4 flex items-center gap-3 no-underline hover:shadow-lg transition-all"
              >
                <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {autre?.photo ? <img src={autre.photo} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-semibold text-slate-500">{autre?.prenom?.[0]}{autre?.nom?.[0]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{autre ? `${autre.prenom} ${autre.nom}` : 'Utilisateur'}</p>
                  <p className={`text-xs truncate ${c.nonLus > 0 ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>{c.dernierMessage || 'Nouvelle conversation'}</p>
                </div>
                {c.nonLus > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#007AFF] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">{c.nonLus}</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Conversations;
