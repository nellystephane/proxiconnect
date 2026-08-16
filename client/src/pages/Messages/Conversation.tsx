import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Send, AlertCircle, Loader2, Smile, Paperclip, X, FileText,
  Download, File as FileIcon, FileSpreadsheet,
} from 'lucide-react';
import API, { API_BASE_URL } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { getSocket } from '../../api/socket';
import { Avatar, Spinner } from '../../components/ui';
import { libellePresence, PointPresence } from '../../utils/presence';

// ─── Sélection courte d'emojis fréquents (pas de dépendance externe : le
// champ de message accepte déjà n'importe quel texte, l'emoji n'est qu'un
// caractère unicode inséré dans la saisie). ───
const EMOJIS_RAPIDES = ['😀', '😂', '😍', '👍', '🙏', '🎉', '❤️', '😢', '😮', '🔥', '✅', '👏'];

// ─── Pièces jointes : mêmes règles que côté serveur (routes/uploadRoutes.js),
// dupliquées ici uniquement pour donner un retour immédiat à l'utilisateur
// avant même l'envoi — le serveur reste la seule source de vérité. ───
const TAILLE_MAX_PIECE_JOINTE = 10 * 1024 * 1024; // 10 Mo
const TYPES_ACCEPTES = 'image/jpeg,image/png,image/webp,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain';

interface PieceJointe { url: string; nom: string; type: string; taille: number; }
interface Participant { _id: string; nom: string; prenom: string; photo?: string; enLigne?: boolean; dernierActivite?: string | null; }
interface Message { _id: string; conversation: string; expediteur: string; contenu: string; createdAt: string; pieceJointe?: PieceJointe; }

const formaterTaille = (octets: number) => {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
};

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
// expéditeur (un avatar par groupe, pas par message — gabarit messagerie). ───
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

// ─── Icône adaptée au type de fichier (PDF/Word → document, Excel →
// tableur) : purement décoratif, aucune règle métier ici. ───
const iconePieceJointe = (type: string) => {
  if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
  if (type.includes('pdf') || type.includes('word') || type.startsWith('text/')) return FileText;
  return FileIcon;
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
  const [emojiOuvert, setEmojiOuvert] = useState(false);
  const [pieceJointeFichier, setPieceJointeFichier] = useState<File | null>(null);
  const [apercuImage, setApercuImage] = useState<string | null>(null);
  const [uploadEnCours, setUploadEnCours] = useState(false);
  const [pieceJointeErreur, setPieceJointeErreur] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saisieRef = useRef<HTMLTextAreaElement>(null);

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

    const surPresence = ({ userId, enLigne, dernierActivite }: { userId: string; enLigne: boolean; dernierActivite: string | null }) => {
      setParticipants((prev) => prev.map((p) => (p._id === userId ? { ...p, enLigne, dernierActivite } : p)));
    };
    socket.on('presence:maj', surPresence);

    return () => {
      socket.emit('conversation:quitter', id);
      socket.off('message:nouveau', surNouveauMessage);
      socket.off('presence:maj', surPresence);
    };
  }, [token, id]);

  // ─── Champ extensible : la hauteur du textarea suit son contenu puis
  // retombe après l'envoi (visuel uniquement — la valeur reste l'état
  // `texte` d'origine, aucun changement de comportement de saisie). ───
  useEffect(() => {
    const el = saisieRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [texte]);

  const choisirFichier = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    e.target.value = ''; // permet de resélectionner le même fichier ensuite
    if (!fichier) return;

    setPieceJointeErreur('');
    if (fichier.size > TAILLE_MAX_PIECE_JOINTE) {
      setPieceJointeErreur('Fichier trop volumineux (10 Mo maximum).');
      return;
    }
    if (!TYPES_ACCEPTES.split(',').includes(fichier.type)) {
      setPieceJointeErreur('Type de fichier non pris en charge.');
      return;
    }

    setPieceJointeFichier(fichier);
    setApercuImage(fichier.type.startsWith('image/') ? URL.createObjectURL(fichier) : null);
  };

  const annulerPieceJointe = () => {
    if (apercuImage) URL.revokeObjectURL(apercuImage);
    setPieceJointeFichier(null);
    setApercuImage(null);
    setPieceJointeErreur('');
  };

  const envoyer = useCallback(async () => {
    const contenu = texte.trim();
    if (!contenu && !pieceJointeFichier) return;
    if (!id || !token) return;

    setEnvoi(true);
    setPieceJointeErreur('');

    // ─── La pièce jointe est uploadée d'abord (même convention que
    // ImageUploader : fetch + FormData + URL absolue stockée telle quelle),
    // puis le message (texte éventuel + pièce jointe) part par le socket. ───
    let pieceJointe: PieceJointe | undefined;
    if (pieceJointeFichier) {
      setUploadEnCours(true);
      try {
        const formData = new FormData();
        formData.append('fichier', pieceJointeFichier);
        const reponse = await fetch(`${API_BASE_URL}/api/upload/piece-jointe`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await reponse.json();
        if (!reponse.ok) throw new Error(data.message || "Erreur lors de l'envoi du fichier.");
        pieceJointe = { url: `${API_BASE_URL}${data.url}`, nom: data.nom, type: data.type, taille: data.taille };
      } catch (err: any) {
        setUploadEnCours(false);
        setEnvoi(false);
        setPieceJointeErreur(err.message || "Erreur lors de l'envoi du fichier.");
        return;
      }
      setUploadEnCours(false);
    }

    setTexte('');
    if (apercuImage) URL.revokeObjectURL(apercuImage);
    setPieceJointeFichier(null);
    setApercuImage(null);

    const socket = getSocket(token);
    socket.emit('message:envoyer', { conversationId: id, contenu, pieceJointe }, (reponse: { message?: Message; erreur?: string }) => {
      setEnvoi(false);
      if (reponse?.erreur) {
        setErreur(true);
      } else if (reponse?.message) {
        setMessages((prev) => (prev.some((m) => m._id === reponse.message!._id) ? prev : [...prev, reponse.message!]));
      }
    });
  }, [texte, pieceJointeFichier, id, token]);

  const autre = participants.find((p) => p._id !== user?._id) || participants[0];
  const sections = useMemo(() => grouperParJourEtAuteur(messages), [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    // ─── Plein écran fluide : la hauteur s'ajuste à la topbar + nav mobile,
    // le canvas des messages reste transparent sur le fond "aurora". ───
    <div className="w-full max-w-2xl lg:max-w-3xl mx-auto flex flex-col h-[calc(100dvh-9.75rem)] min-h-[440px] lg:h-[calc(100dvh-8.5rem)] animate-fade-in">
      {/* ─── En-tête collant : retour mobile + avatar + nom + présence ─── */}
      <div className="glass-nav rounded-t-3xl flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 flex-shrink-0">
        <Link
          to="/messages"
          aria-label="Retour aux messages"
          className="glass-control w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-slate-600 hover:text-slate-900 transition-all active:scale-90"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
        </Link>
        <div className="relative flex-shrink-0">
          <Avatar photo={autre?.photo} prenom={autre?.prenom} nom={autre?.nom} size="sm" />
          <PointPresence enLigne={autre?.enLigne} className="absolute -bottom-0.5 -right-0.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 text-sm truncate">{autre ? `${autre.prenom} ${autre.nom}` : 'Conversation'}</p>
          {autre && libellePresence(autre.enLigne, autre.dernierActivite) && (
            <p className={`text-[11px] flex items-center gap-1.5 ${autre.enLigne ? 'text-emerald-500 font-medium' : 'text-slate-400'}`}>
              {autre.enLigne && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />}
              {libellePresence(autre.enLigne, autre.dernierActivite)}
            </p>
          )}
        </div>
      </div>

      {/* ─── Fil de discussion : bulles dégradées (moi) / verre (correspondant),
          séparateurs de jour en pilules, regroupement par expéditeur conservé ─── */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-5 pt-4 pb-2 space-y-3" role="log" aria-live="polite" aria-label="Messages de la conversation">
        {erreur && messages.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center gap-2 text-red-500">
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
            <p className="text-sm">Impossible de charger cette conversation.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-12">
            <div className="glass w-14 h-14 rounded-2xl flex items-center justify-center">
              <Send className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <p className="text-sm text-slate-400 max-w-[240px]">Envoyez le premier message !</p>
          </div>
        ) : (
          sections.map((section) => (
            <div key={section.jour}>
              {/* Chip de date centrée */}
              <div className="flex justify-center my-3">
                <span className="glass-pill rounded-full px-3.5 py-1 text-[11px] font-semibold text-slate-500">{section.jour}</span>
              </div>
              <div className="space-y-2.5">
                {section.groupes.map((groupe, gi) => {
                  const estMoi = groupe.expediteur === user?._id;
                  return (
                    <div key={gi} className={`flex items-end gap-2 ${estMoi ? 'justify-end' : 'justify-start'}`}>
                      {!estMoi && <Avatar photo={autre?.photo} prenom={autre?.prenom} nom={autre?.nom} size="sm" />}
                      <div className={`flex flex-col gap-1 max-w-[78%] sm:max-w-[70%] ${estMoi ? 'items-end' : 'items-start'}`}>
                        {groupe.messages.map((m, mi) => {
                          const dernier = mi === groupe.messages.length - 1;
                          return (
                            <div
                              key={m._id}
                              className={`overflow-hidden rounded-2xl ${
                                estMoi
                                  ? `${dernier ? 'rounded-br-md' : ''}`
                                  : `${dernier ? 'rounded-bl-md' : ''}`
                              } ${!m.pieceJointe ? (estMoi ? 'text-white px-4 py-2.5 shadow-md' : 'glass-light text-slate-900 px-4 py-2.5') : ''}`}
                              style={!m.pieceJointe && estMoi ? { background: 'var(--gradient-primary)' } : undefined}
                            >
                              {m.pieceJointe && (
                                m.pieceJointe.type.startsWith('image/') ? (
                                  // Image : vignette arrondie cliquable (ouverture dans un onglet)
                                  <a href={m.pieceJointe.url} target="_blank" rel="noreferrer" className="block rounded-2xl overflow-hidden">
                                    <img
                                      src={m.pieceJointe.url}
                                      alt={m.pieceJointe.nom}
                                      className={`w-[220px] max-h-64 object-cover ${estMoi ? 'ring-1 ring-white/30' : 'ring-1 ring-slate-200/60'}`}
                                    />
                                  </a>
                                ) : (
                                  // Document : carte icône + nom + taille, téléchargeable
                                  (() => {
                                    const IconeDoc = iconePieceJointe(m.pieceJointe!.type);
                                    return (
                                      <a
                                        href={m.pieceJointe!.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        download={m.pieceJointe!.nom}
                                        className={`flex items-center gap-3 px-4 py-3 no-underline min-w-[200px] max-w-[260px] rounded-xl ${estMoi ? 'text-white shadow-md' : 'glass-light text-slate-900'}`}
                                        style={estMoi ? { background: 'var(--gradient-primary)' } : undefined}
                                      >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${estMoi ? 'bg-white/20' : 'bg-white/70'}`}>
                                          <IconeDoc className="w-[18px] h-[18px]" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-semibold truncate">{m.pieceJointe!.nom}</p>
                                          <p className={`text-[10px] ${estMoi ? 'text-white/70' : 'text-slate-400'}`}>{formaterTaille(m.pieceJointe!.taille)}</p>
                                        </div>
                                        <Download className="w-4 h-4 flex-shrink-0 opacity-70" />
                                      </a>
                                    );
                                  })()
                                )
                              )}
                              {m.contenu && (
                                <p
                                  className={`text-sm leading-relaxed break-words ${m.pieceJointe ? `px-4 pt-2 pb-2.5 ${estMoi ? 'text-white shadow-md' : 'glass-light text-slate-900'}` : ''}`}
                                  style={m.pieceJointe && estMoi ? { background: 'var(--gradient-primary)' } : undefined}
                                >
                                  {m.contenu}
                                </p>
                              )}
                            </div>
                          );
                        })}
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

      {/* ─── Barre de saisie flottante : aperçu/annulation de la pièce jointe,
          pop-over d'emojis, champ extensible, envoi circulaire "liquid" ─── */}
      <div className="flex-shrink-0 px-2 sm:px-3 pt-1 pb-2.5">
        {(pieceJointeFichier || pieceJointeErreur) && (
          <div className="px-1 pb-2 animate-scale-in">
            {pieceJointeFichier && (
              <div className="glass rounded-2xl p-2 flex items-center gap-3 w-fit max-w-full shadow-md">
                {apercuImage ? (
                  <img src={apercuImage} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const IconeApercu = iconePieceJointe(pieceJointeFichier.type);
                      return <IconeApercu className="w-[18px] h-[18px] text-primary" />;
                    })()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate max-w-[180px]">{pieceJointeFichier.name}</p>
                  <p className="text-[11px] text-slate-400">{formaterTaille(pieceJointeFichier.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={annulerPieceJointe}
                  disabled={uploadEnCours}
                  className="ml-1 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors flex-shrink-0 disabled:opacity-50"
                  aria-label="Annuler la pièce jointe"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {pieceJointeErreur && (
              <p className="text-xs text-red-500 flex items-center gap-1.5 mt-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{pieceJointeErreur}</p>
            )}
          </div>
        )}

        <div className="relative">
          {emojiOuvert && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setEmojiOuvert(false)} />
              <div className="absolute bottom-full left-1 mb-2.5 z-20 glass-solid rounded-2xl p-2 grid grid-cols-6 gap-1 animate-scale-in origin-bottom-left">
                {EMOJIS_RAPIDES.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => { setTexte((t) => t + emoji); setEmojiOuvert(false); }}
                    className="w-9 h-9 flex items-center justify-center text-lg rounded-xl hover:bg-white/60 transition-colors"
                    aria-label={`Insérer ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
          <input ref={fileInputRef} type="file" accept={TYPES_ACCEPTES} onChange={choisirFichier} className="hidden" />
          <div className="glass-elevated rounded-[28px] p-1.5 flex items-end gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadEnCours}
              className="glass-control w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-slate-500 hover:text-slate-800 transition-all active:scale-90 disabled:opacity-50"
              aria-label="Joindre un fichier"
            >
              <Paperclip className="w-[18px] h-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => setEmojiOuvert((o) => !o)}
              className="glass-control w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-slate-500 hover:text-slate-800 transition-all active:scale-90"
              aria-label="Insérer un emoji"
            >
              <Smile className="w-[18px] h-[18px]" />
            </button>
            <label htmlFor="message-input" className="sr-only">Écrire un message</label>
            <textarea
              id="message-input"
              ref={saisieRef}
              rows={1}
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
              placeholder={pieceJointeFichier ? 'Ajouter une légende (facultatif)…' : 'Écrire un message…'}
              className="flex-1 min-w-0 resize-none bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400 leading-relaxed py-2.5 px-1.5 max-h-[120px]"
            />
            <button
              type="button"
              onClick={envoyer}
              disabled={envoi || uploadEnCours || (!texte.trim() && !pieceJointeFichier)}
              className="btn-liquid-primary w-10 h-10 rounded-full flex-shrink-0 disabled:pointer-events-none disabled:opacity-40"
              aria-label="Envoyer le message"
            >
              {envoi || uploadEnCours ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Send className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conversation;
