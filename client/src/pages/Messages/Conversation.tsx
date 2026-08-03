import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle, Loader2 } from 'lucide-react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { getSocket } from '../../api/socket';

interface Participant { _id: string; nom: string; prenom: string; photo?: string; }
interface Message { _id: string; conversation: string; expediteur: string; contenu: string; createdAt: string; }

const initiales = (p?: Participant) => (p ? `${p.prenom?.[0] || ''}${p.nom?.[0] || ''}` : '?');

const heure = (date: string) => new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const libelleJour = (date: string) => {
  const d = new Date(date);
  const aujourdHui = new Date();
  const hier = new Date(aujourdHui);
  hier.setDate(hier.getDate() - 1);
  if (d.toDateString() === aujourdHui.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === hier.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: d.getFullYear() !== aujourdHui.getFullYear() ? 'numeric' : undefined });
};

// ─── Regroupe les messages par jour, puis par rafales successives du même
// expéditeur (comme un vrai gabarit de messagerie : un avatar par groupe,
// pas par message) ───
interface GroupeMessages { expediteur: string; messages: Message[]; }
const grouperParJourEtAuteur = (messages: Message[]) => {
  const parJour: { jour: string; groupes: GroupeMessages[] }[] = [];
  for (const m of messages) {
    const jour = libelleJour(m.createdAt);
    let section = parJour.find((s) => s.jour === jour);
    if (!section) { section = { jour, groupes: [] }; parJour.push(section); }
    const dernierGroupe = section.groupes[section.groupes.length - 1];
    if (dernierGroupe && dernierGroupe.expediteur === m.expediteur) {
      dernierGroupe.messages.push(m);
    } else {
      section.groupes.push({ expediteur: m.expediteur, messages: [m] });
    }
  }
  return parJour;
};

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
  const sections = useMemo(() => grouperParJourEtAuteur(messages), [messages]);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="h-8 w-8 border-2 border-blue-200 border-t-[#007AFF] rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100dvh-6rem)] animate-fade-in">
      <div className="glass rounded-3xl shadow-lg flex-1 flex flex-col overflow-hidden">
        {/* En-tête façon Deposer : icône + titre, collant en haut de la carte */}
        <div className="glass-nav flex items-center gap-3 px-4 py-3 flex-shrink-0">
          <Link to="/messages" className="glass-control w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" aria-label="Retour">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white">
            {autre?.photo ? <img src={autre.photo} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-[#007AFF]">{initiales(autre)}</span>}
          </div>
          <p className="font-semibold text-slate-900 text-sm">{autre ? `${autre.prenom} ${autre.nom}` : 'Conversation'}</p>
        </div>

        {/* Fil de discussion */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {erreur && messages.length === 0 ? (
            <p className="text-sm text-red-500 flex items-center gap-1.5 py-10 justify-center"><AlertCircle className="w-4 h-4" />Impossible de charger cette conversation.</p>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Send className="w-5 h-5 text-[#007AFF]" />
              </div>
              <p className="text-sm text-slate-400">Envoyez le premier message !</p>
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.jour}>
                <div className="flex justify-center mb-4">
                  <span className="text-[11px] font-medium text-slate-400 bg-white/60 px-3 py-1 rounded-full">{section.jour}</span>
                </div>
                <div className="space-y-3">
                  {section.groupes.map((groupe, gi) => {
                    const estMoi = groupe.expediteur === user?._id;
                    return (
                      <div key={gi} className={`flex items-end gap-2 ${estMoi ? 'justify-end' : 'justify-start'}`}>
                        {!estMoi && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white">
                            {autre?.photo ? <img src={autre.photo} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-[#007AFF]">{initiales(autre)}</span>}
                          </div>
                        )}
                        <div className={`flex flex-col gap-1 max-w-[72%] ${estMoi ? 'items-end' : 'items-start'}`}>
                          {groupe.messages.map((m, mi) => (
                            <div
                              key={m._id}
                              className={`px-4 py-2.5 text-sm leading-relaxed rounded-2xl ${
                                estMoi
                                  ? `bg-[#007AFF] text-white ${mi === groupe.messages.length - 1 ? 'rounded-br-md' : ''}`
                                  : `glass-light text-slate-800 ${mi === groupe.messages.length - 1 ? 'rounded-bl-md' : ''}`
                              }`}
                            >
                              {m.contenu}
                            </div>
                          ))}
                          <span className="text-[10px] text-slate-400 px-1">{heure(groupe.messages[groupe.messages.length - 1].createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={finDesMessagesRef} />
        </div>

        {/* Barre de saisie, même gabarit que les champs de Deposer */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/40 flex-shrink-0">
          <input
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
            placeholder="Écrire un message…"
            className="flex-1 px-4 py-3 bg-white/80 border border-slate-200 rounded-full text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <button
            onClick={envoyer}
            disabled={envoi || !texte.trim()}
            className="w-11 h-11 rounded-full bg-[#007AFF] text-white flex items-center justify-center hover:bg-blue-600 transition disabled:opacity-50 flex-shrink-0 shadow-lg shadow-blue-500/25"
          >
            {envoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Conversation;
