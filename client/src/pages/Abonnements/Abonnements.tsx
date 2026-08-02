import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, Crown, Video, Star, Zap, ArrowLeft, Smartphone,
  AlertCircle, X as XIcon, Loader2, RotateCcw
} from 'lucide-react';
import API from '../../api/axios';
import type { Offre, AbonnementStatut, Paiement } from '../../types';

const OPERATEURS = [
  { id: 'orange_money', label: 'Orange Money' },
  { id: 'mtn_money', label: 'MTN Money' },
  { id: 'moov_money', label: 'Moov Money' },
  { id: 'wave', label: 'Wave' },
  { id: 'celtiis', label: 'Celtiis Cash' },
];

const ICONES_OFFRE: Record<string, React.ElementType> = {
  gratuit: Star,
  abonnement_30j: Zap,
  abonnement_90j: Crown,
  abonnement_annuel: Video,
};

// Le paiement reste "en_attente" tant que l'opérateur Mobile Money n'a pas
// confirmé la transaction. On interroge le statut à intervalle régulier et on
// abandonne au bout de ce délai si rien n'a été confirmé côté opérateur.
const INTERVALLE_POLLING_MS = 3000;
const DELAI_MAX_MS = 120000; // 2 minutes

type EtapePaiement = 'formulaire' | 'attente' | 'succes' | 'echec';

const Abonnements = () => {
  const navigate = useNavigate();
  const [offres, setOffres] = useState<Offre[]>([]);
  const [statut, setStatut] = useState<AbonnementStatut | null>(null);
  const [loading, setLoading] = useState(true);

  const [offreChoisie, setOffreChoisie] = useState<Offre | null>(null);
  const [operateur, setOperateur] = useState('orange_money');
  const [numero, setNumero] = useState('');
  const [etape, setEtape] = useState<EtapePaiement>('formulaire');
  const [secondesEcoulees, setSecondesEcoulees] = useState(0);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debutAttenteRef = useRef<number>(0);

  useEffect(() => {
    Promise.all([
      API.get('/paiements/offres'),
      API.get('/paiements/statut').catch(() => ({ data: null })),
    ]).then(([offresRes, statutRes]) => {
      setOffres(offresRes.data);
      setStatut(statutRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const arreterPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Nettoyage si le composant se démonte pendant une attente en cours
  useEffect(() => () => arreterPolling(), [arreterPolling]);

  const ouvrirPaiement = (offre: Offre) => {
    if (offre.type === 'gratuit') return;
    arreterPolling();
    setOffreChoisie(offre);
    setEtape('formulaire');
    setErreur('');
    setNumero('');
  };

  const fermerModale = () => {
    arreterPolling();
    setOffreChoisie(null);
  };

  const demarrerPolling = useCallback((id: string) => {
    debutAttenteRef.current = Date.now();
    setSecondesEcoulees(0);
    arreterPolling();

    pollingRef.current = setInterval(async () => {
      const ecoule = Date.now() - debutAttenteRef.current;
      setSecondesEcoulees(Math.floor(ecoule / 1000));

      if (ecoule >= DELAI_MAX_MS) {
        arreterPolling();
        setErreur("Nous n'avons pas reçu de confirmation de l'opérateur à temps. Réessayez ou vérifiez votre téléphone.");
        setEtape('echec');
        return;
      }

      try {
        const { data } = await API.get<Paiement>(`/paiements/${id}`);
        if (data.statut === 'confirmé') {
          arreterPolling();
          setEtape('succes');
          const { data: statutData } = await API.get('/paiements/statut');
          setStatut(statutData);
        } else if (data.statut === 'échoué' || data.statut === 'expiré') {
          arreterPolling();
          setErreur("Le paiement a été refusé ou a expiré du côté de l'opérateur.");
          setEtape('echec');
        }
        // 'en_attente' → on continue de sonder
      } catch {
        // Erreur réseau ponctuelle : on retente au prochain intervalle,
        // on ne fait échouer le paiement que sur le timeout global.
      }
    }, INTERVALLE_POLLING_MS);
  }, [arreterPolling]);

  const handleInitierPaiement = async () => {
    if (!offreChoisie) return;
    if (!numero.trim()) {
      setErreur('Veuillez renseigner votre numéro Mobile Money.');
      return;
    }
    setEnvoi(true);
    setErreur('');
    try {
      const { data } = await API.post('/paiements', {
        type: offreChoisie.type,
        methode: 'mobile_money',
        operateur,
        numeroTransaction: numero,
      });
      setEtape('attente');
      demarrerPolling(data._id);
    } catch (err: any) {
      setErreur(err.response?.data?.message || "Erreur lors de l'initialisation du paiement.");
    } finally {
      setEnvoi(false);
    }
  };

  const handleReessayer = () => {
    setErreur('');
    setEtape('formulaire');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-2 border-blue-200 border-t-[#007AFF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#007AFF] mb-4 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Choisissez votre offre</h1>
        <p className="text-sm text-slate-500">Publiez plus d'annonces, ajoutez des vidéos et mettez-vous en avant.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {offres.map((offre) => {
          const Icone = ICONES_OFFRE[offre.type] || Star;
          const estActive = statut?.type === offre.type || (offre.type === 'gratuit' && !statut?.estAbonne);
          const estAnnuel = offre.type === 'abonnement_annuel';
          const nombreIllimite = offre.avantages.nombreAnnonces >= 999999;

          return (
            <div
              key={offre.type}
              className={`relative p-5 rounded-2xl border transition-all ${
                estAnnuel ? 'border-[#007AFF] bg-blue-50/40 shadow-lg shadow-blue-100' : 'border-slate-200 bg-white'
              } ${estActive ? 'ring-2 ring-[#007AFF]' : ''}`}
            >
              {estAnnuel && (
                <span className="absolute -top-3 left-5 text-[10px] font-bold uppercase tracking-wide bg-[#007AFF] text-white px-2.5 py-1 rounded-full">
                  Meilleure offre
                </span>
              )}
              {estActive && (
                <span className="absolute -top-3 right-5 text-[10px] font-bold uppercase tracking-wide bg-emerald-500 text-white px-2.5 py-1 rounded-full">
                  Offre actuelle
                </span>
              )}

              <div className="flex items-center gap-2 mb-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${estAnnuel ? 'bg-[#007AFF] text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Icone className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900">{offre.label}</h3>
              </div>

              <p className="text-2xl font-bold text-slate-900 mb-1">
                {offre.prix === 0 ? 'Gratuit' : `${offre.prix.toLocaleString('fr-FR')} XOF`}
              </p>
              <p className="text-xs text-slate-400 mb-4">Durée de vie des annonces : {offre.duree}</p>

              <ul className="space-y-2 mb-5 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {nombreIllimite
                    ? 'Annonces illimitées'
                    : `${offre.avantages.nombreAnnonces} annonce${offre.avantages.nombreAnnonces > 1 ? 's' : ''} active${offre.avantages.nombreAnnonces > 1 ? 's' : ''}`}
                </li>
                <li className={`flex items-center gap-2 ${!offre.avantages.videoAutorisee ? 'text-slate-300' : ''}`}>
                  {offre.avantages.videoAutorisee ? <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <XIcon className="w-4 h-4 flex-shrink-0" />}
                  Ajout d'une vidéo
                </li>
                <li className={`flex items-center gap-2 ${!offre.avantages.miseEnAvant ? 'text-slate-300' : ''}`}>
                  {offre.avantages.miseEnAvant ? <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <XIcon className="w-4 h-4 flex-shrink-0" />}
                  Mise en avant prioritaire
                </li>
              </ul>

              {offre.type !== 'gratuit' && (
                <button
                  onClick={() => ouvrirPaiement(offre)}
                  disabled={estActive}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    estAnnuel ? 'bg-[#007AFF] text-white hover:bg-blue-600' : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {estActive ? 'Offre active' : "S'abonner"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400 max-w-md mx-auto">
        Paiement sécurisé par Mobile Money (Orange Money, MTN Money, Moov Money, Wave, Celtiis).
        Carte bancaire et virement bientôt disponibles.
      </p>

      {/* Modale de paiement, centrée */}
      {offreChoisie && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={etape === 'attente' ? undefined : fermerModale}
        >
          <div
            className="w-full max-w-md glass rounded-3xl shadow-2xl p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-900">Abonnement {offreChoisie.label}</h2>
              {etape !== 'attente' && (
                <button onClick={fermerModale} className="p-1.5 rounded-full hover:bg-slate-100">
                  <XIcon className="w-4 h-4 text-slate-500" />
                </button>
              )}
            </div>

            {etape === 'formulaire' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Montant à payer : <span className="font-bold text-slate-900">{offreChoisie.prix.toLocaleString('fr-FR')} XOF</span>
                </p>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Opérateur</label>
                  <div className="grid grid-cols-2 gap-2">
                    {OPERATEURS.map((op) => (
                      <button
                        key={op.id}
                        onClick={() => setOperateur(op.id)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition ${
                          operateur === op.id ? 'border-[#007AFF] bg-blue-50 text-[#007AFF]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Numéro Mobile Money</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      placeholder="01 23 45 67 89"
                      className="w-full pl-10 pr-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {erreur && (
                  <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{erreur}</p>
                )}

                <button
                  onClick={handleInitierPaiement}
                  disabled={envoi}
                  className="w-full py-3.5 bg-[#007AFF] text-white rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {envoi && <Loader2 className="w-4 h-4 animate-spin" />}
                  Payer {offreChoisie.prix.toLocaleString('fr-FR')} XOF
                </button>
              </div>
            )}

            {etape === 'attente' && (
              <div className="space-y-4 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 flex items-center justify-center relative">
                  <Smartphone className="w-6 h-6 text-[#007AFF]" />
                  <span className="absolute inset-0 rounded-full border-2 border-[#007AFF]/30 border-t-[#007AFF] animate-spin" />
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Une demande de paiement a été envoyée à votre numéro <span className="font-semibold">{numero}</span> via {OPERATEURS.find(o => o.id === operateur)?.label}.
                  Validez la transaction directement sur votre téléphone.
                </p>
                <p className="text-xs text-slate-400">
                  En attente de confirmation… {secondesEcoulees}s
                </p>
              </div>
            )}

            {etape === 'echec' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-red-500" />
                </div>
                <p className="font-semibold text-slate-900">Paiement non confirmé</p>
                <p className="text-sm text-slate-500">{erreur}</p>
                <button
                  onClick={handleReessayer}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Réessayer
                </button>
              </div>
            )}

            {etape === 'succes' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                  <Check className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="font-semibold text-slate-900">Abonnement activé avec succès !</p>
                <p className="text-sm text-slate-500">Vos nouveaux avantages sont disponibles dès maintenant.</p>
                <button
                  onClick={() => { fermerModale(); navigate('/profil'); }}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition"
                >
                  Retour au profil
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Abonnements;
