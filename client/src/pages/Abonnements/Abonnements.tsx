import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, Crown, Video, Star, Zap, ArrowLeft, Smartphone,
  AlertCircle, X as XIcon, RotateCcw
} from 'lucide-react';
import API from '../../api/axios';
import { Spinner, Modal, Card, Button, Input } from '../../components/ui';
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
        <Spinner size="lg" />
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
            <Card
              key={offre.type}
              variant={estAnnuel ? 'glass-solid' : 'glass'}
              interactive
              className={`relative !rounded-2xl p-5 ${estAnnuel ? 'shadow-lg' : ''} ${estActive ? 'ring-2 ring-[#007AFF]' : ''}`}
            >
              {estAnnuel && (
                <span className="absolute -top-3 left-5 text-[10px] font-bold uppercase tracking-wide text-white px-2.5 py-1 rounded-full btn-liquid-primary">
                  Meilleure offre
                </span>
              )}
              {estActive && (
                <span className="absolute -top-3 right-5 text-[10px] font-bold uppercase tracking-wide bg-emerald-500 text-white px-2.5 py-1 rounded-full shadow-sm">
                  Offre actuelle
                </span>
              )}

              <div className="flex items-center gap-2 mb-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${estAnnuel ? 'bg-[#007AFF] text-white' : 'glass-light text-slate-500'}`}>
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
                <Button
                  onClick={() => ouvrirPaiement(offre)}
                  disabled={estActive}
                  variant={estAnnuel ? 'primary' : 'ghost'}
                  fullWidth
                >
                  {estActive ? 'Offre active' : "S'abonner"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400 max-w-md mx-auto">
        Paiement sécurisé par Mobile Money (Orange Money, MTN Money, Moov Money, Wave, Celtiis).
        Carte bancaire et virement bientôt disponibles.
      </p>

      {/* Modale de paiement, centrée */}
      {offreChoisie && (
        <Modal
          open
          onClose={etape === 'attente' ? undefined : fermerModale}
          title={`Abonnement ${offreChoisie.label}`}
        >

            {etape === 'formulaire' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Montant à payer : <span className="font-bold text-slate-900">{offreChoisie.prix.toLocaleString('fr-FR')} XOF</span>
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Opérateur</label>
                  <div className="grid grid-cols-2 gap-2">
                    {OPERATEURS.map((op) => (
                      <button
                        key={op.id}
                        onClick={() => setOperateur(op.id)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                          operateur === op.id
                            ? 'border-[#007AFF]/40 bg-blue-50 text-[#007AFF] shadow-sm'
                            : 'glass-light border-transparent text-slate-600 hover:bg-white/60'
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Numéro Mobile Money"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="01 23 45 67 89"
                  icon={<Smartphone className="w-4 h-4" />}
                />

                {erreur && (
                  <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{erreur}</p>
                )}

                <Button
                  onClick={handleInitierPaiement}
                  disabled={envoi}
                  loading={envoi}
                  fullWidth
                >
                  Payer {offreChoisie.prix.toLocaleString('fr-FR')} XOF
                </Button>
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
                <Button onClick={handleReessayer} fullWidth icon={<RotateCcw className="w-4 h-4" />}>
                  Réessayer
                </Button>
              </div>
            )}

            {etape === 'succes' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                  <Check className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="font-semibold text-slate-900">Abonnement activé avec succès !</p>
                <p className="text-sm text-slate-500">Vos nouveaux avantages sont disponibles dès maintenant.</p>
                <Button onClick={() => { fermerModale(); navigate('/profil'); }} fullWidth>
                  Retour au profil
                </Button>
              </div>
            )}
        </Modal>
      )}
    </div>
  );
};

export default Abonnements;
