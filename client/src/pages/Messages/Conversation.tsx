import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle, Loader2 } from 'lucide-react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { getSocket } from '../../api/socket';

interface Participant { _id: string; nom: string; prenom: string; photo?: string; }
interface Message { _id: string; conversation: string; expediteur: string; contenu: string; createdAt: string; }

const Conversation = () => {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const { rafraichirNonLus } = useChat();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(false);
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const finDesMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setErreur(false);

    Promise.all([
      API.get('/conversations'),
      API.get(`/conversations/${id}/messages`),
    ])
      .then(([convRes, msgRes]) => {
        const conv = convRes.data.find((c: { _id: string; participants: Participant[] }) => c._id === id);
        if (conv) setParticipants(conv.participants);
        setMessages(msgRes.data);
      })
      .catch(() => setErreur(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { rafraichirNonLus(); }, [id, rafraichirNonLus]);

  useEffect(() => {
    finDesMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!token || !id) return;
    const socket = getSocket(token);
    socket.emit('conversation:rejoindre', id);

    const surNouveauMessage = (message: Message) => {
      if (message.conversation === id) {
        setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
      }
    };
    socket.on('message:nouveau', surNouveauMessage);

    return () => {
      socket.emit('conversation:quitter', id);
      socket.off('message:nouveau', surNouveauMessage);
    };
  }, [token, id]);

  const envoyer = useCallback(() => {
    if (!texte.trim() || !id || !token) return;
    setEnvoi(true);
    const contenu = texte.trim();
    setTexte('');

    const socket = getSocket(token);
    socket.emit('message:envoyer', { conversationId: id, contenu }, (reponse: { message?: Message; erreur?: string }) => {
      setEnvoi(false);
      if (reponse?.erreur) {
        setErreur(true);
      } else if (reponse?.message) {
        setMessages((prev) => (prev.some((m) => m._id === reponse.message!._id) ? prev : [...prev, reponse.message!]));
      }
    });
  }, [texte, id, token]);

  const autre = participants.find((p) => p._id !== user?._id) || participants[0];

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="h-8 w-8 border-2 border-blue-200 border-t-[#007AFF] rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto pb-4 flex flex-col h-[calc(100dvh-6rem)] animate-fade-in">
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <Link to="/messages" className="p-1.5 rounded-full hover:bg-slate-100"><ArrowLeft className="w-4 h-4 text-slate-500" /></Link>
        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {autre?.photo ? <img src={autre.photo} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-semibold text-slate-500">{autre?.prenom?.[0]}{autre?.nom?.[0]}</span>}
        </div>
        <p className="font-semibold text-slate-900">{autre ? `${autre.prenom} ${autre.nom}` : 'Conversation'}</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {erreur && messages.length === 0 ? (
          <p className="text-sm text-red-500 flex items-center gap-1.5 py-10 justify-center"><AlertCircle className="w-4 h-4" />Impossible de charger cette conversation.</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-10">Envoyez le premier message !</p>
        ) : (
          messages.map((m) => {
            const estMoi = m.expediteur === user?._id;
            return (
              <div key={m._id} className={`flex ${estMoi ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${estMoi ? 'bg-[#007AFF] text-white rounded-br-md' : 'glass text-slate-800 rounded-bl-md'}`}>
                  {m.contenu}
                </div>
              </div>
            );
          })
        )}
        <div ref={finDesMessagesRef} />
      </div>

      <div className="flex items-center gap-2 mt-3 flex-shrink-0">
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
          placeholder="Écrire un message…"
          className="flex-1 px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={envoyer}
          disabled={envoi || !texte.trim()}
          className="w-11 h-11 rounded-xl bg-[#007AFF] text-white flex items-center justify-center hover:bg-blue-600 transition disabled:opacity-50 flex-shrink-0"
        >
          {envoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default Conversation;
