import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Plus, Pencil, Trash2, BedDouble, CalendarCheck, AlertCircle,
  X as XIcon, Check, ExternalLink, Loader2, Crown
} from 'lucide-react';
import API from '../../api/axios';
import ImageUploader from '../../components/ImageUploader';
import AbonnementProWidget from '../../components/AbonnementProWidget/AbonnementProWidget';
import type { Hotel, Chambre, Reservation, AbonnementPro } from '../../types';

type Onglet = 'chambres' | 'reservations' | 'parametres';

const STATUTS_RESERVATION: Reservation['statut'][] = ['en_attente', 'confirmée', 'annulée', 'terminée'];

const chambreVide = { type: '', prixParNuit: '', capacite: '2', photos: [] as string[], estMisEnAvant: false };

const MonHotel = () => {
  const [chargement, setChargement] = useState(true);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [erreur, setErreur] = useState('');
  const [onglet, setOnglet] = useState<Onglet>('chambres');

  const [creationForm, setCreationForm] = useState({ nom: '', description: '', ville: '' });
  const [creationEnCours, setCreationEnCours] = useState(false);
  const [creationErreur, setCreationErreur] = useState('');

  const [chambreModal, setChambreModal] = useState<{ mode: 'creation' | 'edition'; chambre: typeof chambreVide; id?: string } | null>(null);
  const [chambreEnvoi, setChambreEnvoi] = useState(false);
  const [chambreErreur, setChambreErreur] = useState('');
  const [suppressionId, setSuppressionId] = useState<string | null>(null);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsErreur, setReservationsErreur] = useState(false);
  const [majStatutId, setMajStatutId] = useState<string | null>(null);

  const charger = useCallback(() => {
    setChargement(true);
    setErreur('');
    API.get('/hotels/moi')
      .then(({ data }) => { setHotel(data.hotel); setChambres(data.chambres); })
      .catch((err) => { if (err.response?.status !== 404) setErreur('Impossible de charger votre établissement.'); })
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => { charger(); }, [charger]);

  useEffect(() => {
    if (onglet !== 'reservations' || !hotel) return;
    setReservationsErreur(false);
    API.get('/reservations/recues')
      .then(({ data }) => setReservations(data))
      .catch(() => setReservationsErreur(true));
  }, [onglet, hotel]);

  const handleCreer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creationForm.nom.trim()) { setCreationErreur("Le nom de l'établissement est obligatoire."); return; }
    setCreationEnCours(true);
    setCreationErreur('');
    try {
      const { data } = await API.post('/hotels', {
        nom: creationForm.nom, description: creationForm.description,
        localisation: { ville: creationForm.ville },
      });
      setHotel(data);
    } catch (err: any) {
      setCreationErreur(err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setCreationEnCours(false);
    }
  };

  const ouvrirCreationChambre = () => { setChambreErreur(''); setChambreModal({ mode: 'creation', chambre: { ...chambreVide } }); };
  const ouvrirEditionChambre = (c: Chambre) => {
    setChambreErreur('');
    setChambreModal({ mode: 'edition', id: c._id, chambre: { type: c.type, prixParNuit: String(c.prixParNuit), capacite: String(c.capacite), photos: c.photos || [], estMisEnAvant: c.estMisEnAvant } });
  };

  const handleSauverChambre = async () => {
    if (!chambreModal) return;
    const { type, prixParNuit } = chambreModal.chambre;
    if (!type.trim() || !prixParNuit) { setChambreErreur('Type et prix par nuit sont obligatoires.'); return; }
    setChambreEnvoi(true);
    setChambreErreur('');
    const payload = { ...chambreModal.chambre, prixParNuit: Number(chambreModal.chambre.prixParNuit), capacite: Number(chambreModal.chambre.capacite) || 2 };
    try {
      if (chambreModal.mode === 'creation') {
        const { data } = await API.post('/chambres', payload);
        setChambres((prev) => [data, ...prev]);
      } else {
        const { data } = await API.put(`/chambres/${chambreModal.id}`, payload);
        setChambres((prev) => prev.map((c) => (c._id === data._id ? data : c)));
      }
      setChambreModal(null);
    } catch (err: any) {
      setChambreErreur(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setChambreEnvoi(false);
    }
  };

  const handleSupprimerChambre = async (id: string) => {
    setSuppressionId(id);
    try {
      await API.delete(`/chambres/${id}`);
      setChambres((prev) => prev.filter((c) => c._id !== id));
    } catch {
      setErreur('Impossible de supprimer cette chambre. Réessayez.');
    } finally {
      setSuppressionId(null);
    }
  };

  const handleChangerStatut = async (id: string, statut: Reservation['statut']) => {
    setMajStatutId(id);
    try {
      const { data } = await API.put(`/reservations/${id}/statut`, { statut });
      setReservations((prev) => prev.map((r) => (r._id === data._id ? data : r)));
    } catch {
      setReservationsErreur(true);
    } finally {
      setMajStatutId(null);
    }
  };

  if (chargement) return <div className="flex items-center justify-center min-h-[50vh]"><div className="h-8 w-8 border-2 border-blue-200 border-t-[#007AFF] rounded-full animate-spin" /></div>;

  if (!hotel) {
    return (
      <div className="max-w-md mx-auto pb-24 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-3">
            <Building2 className="w-6 h-6 text-[#007AFF]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Créez votre établissement</h1>
          <p className="text-sm text-slate-500">Présentez vos chambres et recevez des réservations.</p>
        </div>

        <form onSubmit={handleCreer} className="glass rounded-2xl p-5 space-y-4">
          <input value={creationForm.nom} onChange={(e) => setCreationForm({ ...creationForm, nom: e.target.value })} placeholder="Nom de l'établissement" className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
          <textarea value={creationForm.description} onChange={(e) => setCreationForm({ ...creationForm, description: e.target.value })} placeholder="Décrivez votre établissement" rows={3} className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          <input value={creationForm.ville} onChange={(e) => setCreationForm({ ...creationForm, ville: e.target.value })} placeholder="Ville" className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
          {creationErreur && <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{creationErreur}</p>}
          <button type="submit" disabled={creationEnCours} className="w-full py-3.5 bg-[#007AFF] text-white rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-60 flex items-center justify-center gap-2">
            {creationEnCours && <Loader2 className="w-4 h-4 animate-spin" />} Créer mon établissement
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      <div className="glass rounded-2xl p-5 mb-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {hotel.logo ? <img src={hotel.logo} alt={hotel.nom} className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 text-slate-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-slate-900 truncate">{hotel.nom}</h1>
          <p className="text-xs text-slate-400">{chambres.length} chambre{chambres.length > 1 ? 's' : ''}</p>
        </div>
        <Link to={`/hotel/${hotel._id}`} target="_blank" className="flex items-center gap-1.5 text-xs font-semibold text-[#007AFF] hover:underline flex-shrink-0">
          Voir la fiche <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {erreur && <p className="text-xs text-red-500 mb-4 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{erreur}</p>}

      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 mb-5 w-fit">
        {([{ id: 'chambres', label: 'Chambres', icon: BedDouble }, { id: 'reservations', label: 'Réservations', icon: CalendarCheck }, { id: 'parametres', label: 'Abonnement', icon: Crown }] as const).map((o) => (
          <button key={o.id} onClick={() => setOnglet(o.id)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition ${onglet === o.id ? 'bg-white text-[#007AFF] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <o.icon className="w-4 h-4" /> {o.label}
          </button>
        ))}
      </div>

      {onglet === 'chambres' && (
        <div>
          <button onClick={ouvrirCreationChambre} className="w-full mb-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:border-[#007AFF] hover:text-[#007AFF] transition flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Ajouter une chambre
          </button>

          {chambres.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">Aucune chambre pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {chambres.map((c) => (
                <div key={c._id} className="glass rounded-2xl p-3 flex gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {c.photos?.[0] ? <img src={c.photos[0]} alt={c.type} className="w-full h-full object-cover" /> : <BedDouble className="w-5 h-5 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{c.type}</p>
                    <p className="text-xs text-slate-400 mb-1">{c.capacite} pers.</p>
                    <p className="text-sm font-bold text-slate-900">{c.prixParNuit.toLocaleString('fr-FR')} XOF / nuit</p>
                    {!c.disponible && <p className="text-[11px] text-red-500">Hors service</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => ouvrirEditionChambre(c)} className="p-1.5 rounded-lg hover:bg-slate-100"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                    <button onClick={() => handleSupprimerChambre(c._id)} disabled={suppressionId === c._id} className="p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {onglet === 'reservations' && (
        <div className="space-y-3">
          {reservationsErreur ? (
            <p className="text-sm text-red-500 flex items-center gap-1.5 py-8 justify-center"><AlertCircle className="w-4 h-4" />Impossible de charger vos réservations.</p>
          ) : reservations.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">Aucune réservation reçue pour le moment.</p>
          ) : (
            reservations.map((r) => (
              <div key={r._id} className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-slate-900">{typeof r.client === 'object' ? `${r.client.prenom} ${r.client.nom}` : 'Client'}</p>
                  <p className="text-sm font-bold text-slate-900">{r.montantTotal.toLocaleString('fr-FR')} XOF</p>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  {typeof r.chambre === 'object' ? r.chambre.type : 'Chambre'} · {new Date(r.dateArrivee).toLocaleDateString('fr-FR')} → {new Date(r.dateDepart).toLocaleDateString('fr-FR')} ({r.nombreNuits} nuit{r.nombreNuits > 1 ? 's' : ''})
                </p>
                <select
                  value={r.statut}
                  onChange={(e) => handleChangerStatut(r._id, e.target.value as Reservation['statut'])}
                  disabled={majStatutId === r._id}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 outline-none disabled:opacity-50"
                >
                  {STATUTS_RESERVATION.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            ))
          )}
        </div>
      )}

      {onglet === 'parametres' && hotel && (
        <AbonnementProWidget
          espaceType="hotel"
          espaceId={hotel._id}
          abonnementPro={hotel.abonnementPro}
          onUpdated={(abonnementPro: AbonnementPro) => setHotel((h) => h && { ...h, abonnementPro })}
        />
      )}

      {chambreModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setChambreModal(null)}>
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto glass rounded-3xl shadow-2xl p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">{chambreModal.mode === 'creation' ? 'Nouvelle chambre' : 'Modifier la chambre'}</h2>
              <button onClick={() => setChambreModal(null)} className="p-1.5 rounded-full hover:bg-slate-100"><XIcon className="w-4 h-4 text-slate-500" /></button>
            </div>

            <div className="space-y-3">
              <ImageUploader currentImage={chambreModal.chambre.photos[0]} onUpload={(url) => setChambreModal((m) => m && { ...m, chambre: { ...m.chambre, photos: [url] } })} />

              <input value={chambreModal.chambre.type} onChange={(e) => setChambreModal((m) => m && { ...m, chambre: { ...m.chambre, type: e.target.value } })} placeholder="Type (ex : Chambre double)" className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />

              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={chambreModal.chambre.prixParNuit} onChange={(e) => setChambreModal((m) => m && { ...m, chambre: { ...m.chambre, prixParNuit: e.target.value } })} placeholder="Prix / nuit (XOF)" className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                <input type="number" value={chambreModal.chambre.capacite} onChange={(e) => setChambreModal((m) => m && { ...m, chambre: { ...m.chambre, capacite: e.target.value } })} placeholder="Capacité (pers.)" className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>

              {chambreModal.mode === 'edition' && (
                <label className={`flex items-center gap-2 text-sm ${hotel?.abonnementPro?.actif ? 'text-slate-600' : 'text-slate-300'}`}>
                  <input
                    type="checkbox"
                    checked={chambreModal.chambre.estMisEnAvant}
                    disabled={!hotel?.abonnementPro?.actif}
                    onChange={(e) => setChambreModal((m) => m && { ...m, chambre: { ...m.chambre, estMisEnAvant: e.target.checked } })}
                    className="w-4 h-4 rounded accent-amber-500 disabled:opacity-40"
                  />
                  Mettre en avant {!hotel?.abonnementPro?.actif && <span className="text-xs text-amber-500 ml-1">(nécessite l'abonnement Pro)</span>}
                </label>
              )}

              {chambreErreur && <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{chambreErreur}</p>}

              <button onClick={handleSauverChambre} disabled={chambreEnvoi} className="w-full py-3.5 bg-[#007AFF] text-white rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {chambreEnvoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {chambreModal.mode === 'creation' ? 'Ajouter la chambre' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonHotel;
