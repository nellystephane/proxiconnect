import { useState, useEffect, useCallback } from 'react';
import {
  Bike, AlertCircle, Loader2, Check, Power, Package, MapPin, Truck, Crown
} from 'lucide-react';
import API from '../../api/axios';
import AbonnementProWidget from '../../components/AbonnementProWidget/AbonnementProWidget';
import type { Livreur, DemandeLivraison, AbonnementPro } from '../../types';

type Onglet = 'disponibles' | 'mes-livraisons' | 'parametres';

const MOYENS_TRANSPORT = ['moto', 'vélo', 'voiture', 'à pied'];

const MonProfilLivreur = () => {
  const [chargement, setChargement] = useState(true);
  const [livreur, setLivreur] = useState<Livreur | null>(null);
  const [erreur, setErreur] = useState('');
  const [onglet, setOnglet] = useState<Onglet>('disponibles');

  const [creationForm, setCreationForm] = useState({ moyenTransport: 'moto', zoneCouverture: '', tarifBase: '500' });
  const [creationEnCours, setCreationEnCours] = useState(false);
  const [creationErreur, setCreationErreur] = useState('');

  const [toggleEnCours, setToggleEnCours] = useState(false);

  const [demandes, setDemandes] = useState<DemandeLivraison[]>([]);
  const [demandesErreur, setDemandesErreur] = useState(false);
  const [demandesChargement, setDemandesChargement] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [mesLivraisons, setMesLivraisons] = useState<DemandeLivraison[]>([]);
  const [mesLivraisonsErreur, setMesLivraisonsErreur] = useState(false);

  const charger = useCallback(() => {
    setChargement(true);
    setErreur('');
    API.get('/livreurs/moi')
      .then(({ data }) => setLivreur(data))
      .catch((err) => { if (err.response?.status !== 404) setErreur('Impossible de charger votre profil livreur.'); })
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => { charger(); }, [charger]);

  useEffect(() => {
    if (!livreur || onglet !== 'disponibles') return;
    setDemandesChargement(true);
    setDemandesErreur(false);
    API.get('/demandes-livraison/disponibles')
      .then(({ data }) => setDemandes(data))
      .catch(() => setDemandesErreur(true))
      .finally(() => setDemandesChargement(false));
  }, [livreur, onglet]);

  useEffect(() => {
    if (!livreur || onglet !== 'mes-livraisons') return;
    setMesLivraisonsErreur(false);
    API.get('/demandes-livraison/mes-livraisons')
      .then(({ data }) => setMesLivraisons(data))
      .catch(() => setMesLivraisonsErreur(true));
  }, [livreur, onglet]);

  const handleCreer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreationEnCours(true);
    setCreationErreur('');
    try {
      const { data } = await API.post('/livreurs', {
        moyenTransport: creationForm.moyenTransport,
        zoneCouverture: creationForm.zoneCouverture.split(',').map((z) => z.trim()).filter(Boolean),
        tarifBase: Number(creationForm.tarifBase) || 500,
      });
      setLivreur(data);
    } catch (err: any) {
      setCreationErreur(err.response?.data?.message || 'Erreur lors de la création du profil.');
    } finally {
      setCreationEnCours(false);
    }
  };

  const toggleDisponibilite = async () => {
    if (!livreur) return;
    setToggleEnCours(true);
    const nouvelleValeur = livreur.disponibilite === 'en_ligne' ? 'hors_ligne' : 'en_ligne';
    try {
      const { data } = await API.put('/livreurs/moi', { disponibilite: nouvelleValeur });
      setLivreur(data);
    } catch {
      setErreur('Impossible de changer votre disponibilité. Réessayez.');
    } finally {
      setToggleEnCours(false);
    }
  };

  const accepterDemande = async (id: string) => {
    setActionId(id);
    try {
      await API.put(`/demandes-livraison/${id}/accepter`);
      setDemandes((prev) => prev.filter((d) => d._id !== id));
    } catch {
      setDemandesErreur(true);
    } finally {
      setActionId(null);
    }
  };

  const changerStatutLivraison = async (id: string, statut: 'en_cours' | 'livrée') => {
    setActionId(id);
    try {
      const { data } = await API.put(`/demandes-livraison/${id}/statut`, { statut });
      setMesLivraisons((prev) => prev.map((d) => (d._id === data._id ? data : d)));
    } catch {
      setMesLivraisonsErreur(true);
    } finally {
      setActionId(null);
    }
  };

  if (chargement) return <div className="flex items-center justify-center min-h-[50vh]"><div className="h-8 w-8 border-2 border-blue-200 border-t-[#007AFF] rounded-full animate-spin" /></div>;

  if (!livreur) {
    return (
      <div className="max-w-md mx-auto pb-24 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-3">
            <Bike className="w-6 h-6 text-[#007AFF]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Devenez livreur</h1>
          <p className="text-sm text-slate-500">Recevez des demandes de livraison près de chez vous.</p>
        </div>

        <form onSubmit={handleCreer} className="glass rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Moyen de transport</label>
            <div className="grid grid-cols-2 gap-2">
              {MOYENS_TRANSPORT.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCreationForm({ ...creationForm, moyenTransport: m })}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border capitalize transition ${creationForm.moyenTransport === m ? 'border-[#007AFF] bg-blue-50 text-[#007AFF]' : 'border-slate-200 text-slate-600'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Zones desservies</label>
            <input value={creationForm.zoneCouverture} onChange={(e) => setCreationForm({ ...creationForm, zoneCouverture: e.target.value })} placeholder="Ex : Cotonou, Akpakpa" className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            <p className="text-[11px] text-slate-400 mt-1">Séparez plusieurs zones par une virgule.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Tarif de base (XOF)</label>
            <input type="number" value={creationForm.tarifBase} onChange={(e) => setCreationForm({ ...creationForm, tarifBase: e.target.value })} className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          {creationErreur && <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{creationErreur}</p>}
          <button type="submit" disabled={creationEnCours} className="w-full py-3.5 bg-[#007AFF] text-white rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-60 flex items-center justify-center gap-2">
            {creationEnCours ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Devenir livreur
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      <div className="glass rounded-2xl p-5 mb-5 flex items-center gap-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${livreur.disponibilite === 'en_ligne' ? 'bg-emerald-50' : 'bg-slate-100'}`}>
          <Bike className={`w-6 h-6 ${livreur.disponibilite === 'en_ligne' ? 'text-emerald-500' : 'text-slate-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 capitalize">{livreur.moyenTransport}</p>
          <p className="text-xs text-slate-400">{livreur.zoneCouverture.join(', ') || 'Aucune zone renseignée'}</p>
        </div>
        <button
          onClick={toggleDisponibilite}
          disabled={toggleEnCours}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-60 ${livreur.disponibilite === 'en_ligne' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}
        >
          <Power className="w-3.5 h-3.5" /> {livreur.disponibilite === 'en_ligne' ? 'En ligne' : 'Hors ligne'}
        </button>
      </div>

      {erreur && <p className="text-xs text-red-500 mb-4 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{erreur}</p>}

      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 mb-5 w-fit">
        {([{ id: 'disponibles', label: 'Demandes', icon: Package }, { id: 'mes-livraisons', label: 'Mes livraisons', icon: Truck }, { id: 'parametres', label: 'Abonnement', icon: Crown }] as const).map((o) => (
          <button key={o.id} onClick={() => setOnglet(o.id)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition ${onglet === o.id ? 'bg-white text-[#007AFF] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <o.icon className="w-4 h-4" /> {o.label}
          </button>
        ))}
      </div>

      {onglet === 'disponibles' && (
        <div className="space-y-3">
          {livreur.disponibilite !== 'en_ligne' && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />Passez en ligne pour recevoir des demandes.</p>
          )}
          {demandesChargement ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
          ) : demandesErreur ? (
            <p className="text-sm text-red-500 flex items-center gap-1.5 py-8 justify-center"><AlertCircle className="w-4 h-4" />Impossible de charger les demandes.</p>
          ) : demandes.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">Aucune demande de livraison disponible pour le moment.</p>
          ) : (
            demandes.map((d) => (
              <div key={d._id} className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase text-slate-400">{d.sourceType === 'vente' ? 'Colis' : 'Repas'}</span>
                  {d.tarif > 0 && <span className="text-sm font-bold text-slate-900">{d.tarif.toLocaleString('fr-FR')} XOF</span>}
                </div>
                <p className="text-sm text-slate-600 flex items-center gap-1.5 mb-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Récupération : {d.adresseRecuperation?.ville || d.adresseRecuperation?.quartier || 'Non précisé'}</p>
                <p className="text-sm text-slate-600 flex items-center gap-1.5 mb-3"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Livraison : {d.adresseLivraison?.ville || d.adresseLivraison?.quartier || 'Non précisé'}</p>
                <button onClick={() => accepterDemande(d._id)} disabled={actionId === d._id || livreur.disponibilite !== 'en_ligne'} className="w-full py-2.5 bg-[#007AFF] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {actionId === d._id && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Accepter cette livraison
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {onglet === 'mes-livraisons' && (
        <div className="space-y-3">
          {mesLivraisonsErreur ? (
            <p className="text-sm text-red-500 flex items-center gap-1.5 py-8 justify-center"><AlertCircle className="w-4 h-4" />Impossible de charger vos livraisons.</p>
          ) : mesLivraisons.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">Aucune livraison pour le moment.</p>
          ) : (
            mesLivraisons.map((d) => (
              <div key={d._id} className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase text-slate-400">{d.sourceType === 'vente' ? 'Colis' : 'Repas'}</span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">{d.statut.replace('_', ' ')}</span>
                </div>
                <p className="text-sm text-slate-600 flex items-center gap-1.5 mb-3"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {d.adresseLivraison?.ville || d.adresseLivraison?.quartier || 'Non précisé'}</p>
                {d.statut === 'assignée' && (
                  <button onClick={() => changerStatutLivraison(d._id, 'en_cours')} disabled={actionId === d._id} className="w-full py-2.5 bg-[#007AFF] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50">Démarrer la course</button>
                )}
                {d.statut === 'en_cours' && (
                  <button onClick={() => changerStatutLivraison(d._id, 'livrée')} disabled={actionId === d._id} className="w-full py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-50">Marquer comme livrée</button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {onglet === 'parametres' && (
        <AbonnementProWidget
          espaceType="livraison"
          espaceId={livreur._id}
          abonnementPro={livreur.abonnementPro}
          onUpdated={(abonnementPro: AbonnementPro) => setLivreur((l) => l && { ...l, abonnementPro })}
        />
      )}
    </div>
  );
};

export default MonProfilLivreur;
