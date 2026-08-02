import { useState, useEffect, useRef, useCallback } from 'react';
import { Crown, Check, Smartphone, AlertCircle, Loader2, X as XIcon, RotateCcw } from 'lucide-react';
import API from '../../api/axios';
import type { AbonnementPro, OffrePro, Paiement } from '../../types';

const OPERATEURS = [
  { id: 'orange_money', label: 'Orange Money' },
  { id: 'mtn_money', label: 'MTN Money' },
  { id: 'moov_money', label: 'Moov Money' },
  { id: 'wave', label: 'Wave' },
  { id: 'celtiis', label: 'Celtiis Cash' },
];

const INTERVALLE_POLLING_MS = 3000;
const DELAI_MAX_MS = 120000;

type Etape = 'offres' | 'formulaire' | 'attente' | 'succes' | 'echec';

interface Props {
  espaceType: 'vente' | 'restauration' | 'hotel' | 'livraison';
  espaceId: string;
  abonnementPro: AbonnementPro;
  onUpdated: (abonnementPro: AbonnementPro) => void;
}

const AVANTAGES_PRO = [
  'Mise en avant illimitée de vos produits, plats ou chambres',
  'Priorité d\'affichage dans l\'annuaire public',
  'Badge Pro visible par les clients',
];

const AbonnementProWidget = ({ espaceType, espaceId, abonnementPro, onUpdated }: Props) => {
  const [modalOuverte, setModalOuverte] = useState(false);
  const [offres, setOffres] = useState<OffrePro[]>([]);
  const [offreChoisie, setOffreChoisie] = useState<OffrePro | null>(null);
  const [operateur, setOperateur] = useState('orange_money');
  const [numero, setNumero] = useState('');
  const [etape, setEtape] = useState<Etape>('offres');
  const [secondesEcoulees, setSecondesEcoulees] = useState(0);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debutAttenteRef = useRef<number>(0);

  const ouvrirModale = () => {
    setEtape('offres');
    setErreur('');
    setOffreChoisie(null);
    setModalOuverte(true);
    if (offres.length === 0) {
      API.get('/paiements/offres-pro').then(({ data }) => setOffres(data)).catch(() => {});
    }
  };

  const arreterPolling = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  }, []);

  useEffect(() => () => arreterPolling(), [arreterPolling]);

  const fermerModale = () => {
    arreterPolling();
    setModalOuverte(false);
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
        setErreur("Nous n'avons pas reçu de confirmation de l'opérateur à temps.");
        setEtape('echec');
        return;
      }

      try {
        const { data } = await API.get<Paiement>(`/paiements/${id}`);
        if (data.statut === 'confirmé') {
          arreterPolling();
          setEtape('succes');
          const { data: statutData } = await API.get<AbonnementPro>('/paiements/statut-pro', { params: { espaceType, espaceId } });
          onUpdated(statutData);
        } else if (data.statut === 'échoué' || data.statut === 'expiré') {
          arreterPolling();
          setErreur("Le paiement a été refusé ou a expiré.");
          setEtape('echec');
        }
      } catch {
        // erreur ponctuelle : on retente au prochain intervalle
      }
    }, INTERVALLE_POLLING_MS);
  }, [arreterPolling, espaceType, espaceId, onUpdated]);

  const handleChoisirOffre = (offre: OffrePro) => {
    setOffreChoisie(offre);
    setNumero('');
    setErreur('');
    setEtape('formulaire');
  };

  const handlePayer = async () => {
    if (!offreChoisie) return;
    if (!numero.trim()) { setErreur('Veuillez renseigner votre numéro Mobile Money.'); return; }
    setEnvoi(true);
    setErreur('');
    try {
      const { data } = await API.post('/paiements/pro', {
        type: offreChoisie.type,
        espaceType,
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

  const estActif = abonnementPro?.actif;

  return (
    <>
      <div className={`glass rounded-2xl p-4 flex items-center gap-4 ${estActif ? 'ring-2 ring-amber-300' : ''}`}>
        <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${estActif ? 'bg-amber-50' : 'bg-slate-100'}`}>
          <Crown className={`w-5 h-5 ${estActif ? 'text-amber-500' : 'text-slate-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">Abonnement Pro</p>
          <p className="text-xs text-slate-500">
            {estActif
              ? `Actif jusqu'au ${abonnementPro.dateFin ? new Date(abonnementPro.dateFin).toLocaleDateString('fr-FR') : ''}`
              : 'Débloquez la mise en avant et la priorité d\'affichage'}
          </p>
        </div>
        <button
          onClick={ouvrirModale}
          className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition flex-shrink-0 ${estActif ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-[#007AFF] text-white hover:bg-blue-600'}`}
        >
          {estActif ? 'Renouveler' : 'Devenir Pro'}
        </button>
      </div>

      {modalOuverte && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={etape === 'attente' ? undefined : fermerModale}
        >
          <div className="w-full max-w-md glass rounded-3xl shadow-2xl p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2"><Crown className="w-4 h-4 text-amber-500" /> Abonnement Pro</h2>
              {etape !== 'attente' && (
                <button onClick={fermerModale} className="p-1.5 rounded-full hover:bg-slate-100"><XIcon className="w-4 h-4 text-slate-500" /></button>
              )}
            </div>

            {etape === 'offres' && (
              <div className="space-y-3">
                <ul className="space-y-1.5 mb-3">
                  {AVANTAGES_PRO.map((a) => (
                    <li key={a} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /> {a}
                    </li>
                  ))}
                </ul>
                {offres.length === 0 ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
                ) : (
                  offres.map((o) => (
                    <button
                      key={o.type}
                      onClick={() => handleChoisirOffre(o)}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-[#007AFF] hover:bg-blue-50 transition text-left"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{o.label}</p>
                        <p className="text-xs text-slate-400">{o.duree}</p>
                      </div>
                      <p className="font-bold text-slate-900">{o.prix.toLocaleString('fr-FR')} XOF</p>
                    </button>
                  ))
                )}
              </div>
            )}

            {etape === 'formulaire' && offreChoisie && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Montant à payer : <span className="font-bold text-slate-900">{offreChoisie.prix.toLocaleString('fr-FR')} XOF</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {OPERATEURS.map((op) => (
                    <button
                      key={op.id}
                      onClick={() => setOperateur(op.id)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition ${operateur === op.id ? 'border-[#007AFF] bg-blue-50 text-[#007AFF]' : 'border-slate-200 text-slate-600'}`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="01 23 45 67 89"
                    className="w-full pl-10 pr-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                {erreur && <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{erreur}</p>}
                <button
                  onClick={handlePayer}
                  disabled={envoi}
                  className="w-full py-3.5 bg-[#007AFF] text-white rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {envoi && <Loader2 className="w-4 h-4 animate-spin" />} Payer {offreChoisie.prix.toLocaleString('fr-FR')} XOF
                </button>
              </div>
            )}

            {etape === 'attente' && (
              <div className="space-y-4 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 flex items-center justify-center relative">
                  <Smartphone className="w-6 h-6 text-[#007AFF]" />
                  <span className="absolute inset-0 rounded-full border-2 border-[#007AFF]/30 border-t-[#007AFF] animate-spin" />
                </div>
                <p className="text-sm text-slate-600">Validez la transaction directement sur votre téléphone.</p>
                <p className="text-xs text-slate-400">En attente de confirmation… {secondesEcoulees}s</p>
              </div>
            )}

            {etape === 'echec' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center"><AlertCircle className="w-7 h-7 text-red-500" /></div>
                <p className="font-semibold text-slate-900">Paiement non confirmé</p>
                <p className="text-sm text-slate-500">{erreur}</p>
                <button onClick={() => setEtape('offres')} className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Réessayer
                </button>
              </div>
            )}

            {etape === 'succes' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center"><Check className="w-7 h-7 text-emerald-500" /></div>
                <p className="font-semibold text-slate-900">Abonnement Pro activé !</p>
                <button onClick={fermerModale} className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition">Fermer</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AbonnementProWidget;
