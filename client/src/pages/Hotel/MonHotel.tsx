import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Plus, Minus, Pencil, Trash2, BedDouble, CalendarCheck, AlertCircle,
  Check, ExternalLink, Crown, LayoutDashboard, TrendingUp, PercentCircle,
  CalendarDays,
} from 'lucide-react';
import API from '../../api/axios';
import { Spinner, Modal, Card, Button, Input, Textarea, Select, Badge } from '../../components/ui';
import ImageUploader from '../../components/ImageUploader';
import AbonnementProWidget from '../../components/AbonnementProWidget/AbonnementProWidget';
import type { Hotel, Chambre, Reservation, AbonnementPro } from '../../types';

const MAX_PHOTOS_CHAMBRE = 10;

type Onglet = 'apercu' | 'chambres' | 'reservations' | 'parametres';

const STATUTS_RESERVATION: Reservation['statut'][] = ['en_attente', 'confirmée', 'annulée', 'terminée'];

const chambreVide = { type: '', prixParNuit: '', capacite: '2', photos: [] as string[], estMisEnAvant: false };

const MonHotel = () => {
  const [chargement, setChargement] = useState(true);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [erreur, setErreur] = useState('');
  const [onglet, setOnglet] = useState<Onglet>('apercu');

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

  // Chargées dès que l'hôtel existe : l'aperçu (taux d'occupation, revenus,
  // prochaines réservations) en a besoin immédiatement, pas seulement une
  // fois l'onglet "Réservations" ouvert.
  useEffect(() => {
    if (!hotel) return;
    setReservationsErreur(false);
    API.get('/reservations/recues')
      .then(({ data }) => setReservations(data))
      .catch(() => setReservationsErreur(true));
  }, [hotel]);

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

  const ouvrirCreationChambre = () => { setChambreErreur(''); setChambreModal({ mode: 'creation', chambre: { ...chambreVide } }); setOnglet('chambres'); };
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
    const payload = {
      ...chambreModal.chambre,
      prixParNuit: Number(chambreModal.chambre.prixParNuit),
      capacite: Number(chambreModal.chambre.capacite) || 2,
      photos: chambreModal.chambre.photos.filter((url) => url && url.trim() !== ''),
    };
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

  // ─── Statistiques dérivées des chambres/réservations déjà chargées ───
  const reservationsValides = useMemo(() => reservations.filter((r) => r.statut !== 'annulée'), [reservations]);
  const chiffreAffaires = useMemo(() => reservationsValides.reduce((s, r) => s + r.montantTotal, 0), [reservationsValides]);
  const chambresDisponibles = useMemo(() => chambres.filter((c) => c.disponible).length, [chambres]);

  const tauxOccupation = useMemo(() => {
    if (chambres.length === 0) return 0;
    const maintenant = new Date();
    const chambresOccupees = new Set(
      reservationsValides
        .filter((r) => r.statut === 'confirmée' && new Date(r.dateArrivee) <= maintenant && new Date(r.dateDepart) >= maintenant)
        .map((r) => (typeof r.chambre === 'object' ? r.chambre._id : r.chambre))
    );
    return Math.round((chambresOccupees.size / chambres.length) * 100);
  }, [chambres, reservationsValides]);

  const prochainesReservations = useMemo(() => {
    const maintenant = new Date();
    return reservationsValides
      .filter((r) => new Date(r.dateDepart) >= maintenant)
      .sort((a, b) => new Date(a.dateArrivee).getTime() - new Date(b.dateArrivee).getTime())
      .slice(0, 5);
  }, [reservationsValides]);

  if (chargement) return <div className="flex items-center justify-center min-h-[50vh]"><Spinner size="lg" /></div>;

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
          <Input value={creationForm.nom} onChange={(e) => setCreationForm({ ...creationForm, nom: e.target.value })} placeholder="Nom de l'établissement" />
          <Textarea value={creationForm.description} onChange={(e) => setCreationForm({ ...creationForm, description: e.target.value })} placeholder="Décrivez votre établissement" rows={3} />
          <Input value={creationForm.ville} onChange={(e) => setCreationForm({ ...creationForm, ville: e.target.value })} placeholder="Ville" />
          {creationErreur && <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{creationErreur}</p>}
          <Button type="submit" loading={creationEnCours} fullWidth size="lg">Créer mon établissement</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      <Card variant="glass-solid" className="mb-5 flex items-center gap-4">
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
      </Card>

      {erreur && <p className="text-xs text-red-500 mb-4 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{erreur}</p>}

      <div className="flex gap-1 p-1 rounded-xl glass-light mb-5 w-fit overflow-x-auto">
        {([
          { id: 'apercu', label: 'Aperçu', icon: LayoutDashboard },
          { id: 'chambres', label: 'Chambres', icon: BedDouble },
          { id: 'reservations', label: 'Réservations', icon: CalendarCheck },
          { id: 'parametres', label: 'Abonnement', icon: Crown },
        ] as const).map((o) => (
          <button key={o.id} onClick={() => setOnglet(o.id)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${onglet === o.id ? 'bg-white text-[#007AFF] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <o.icon className="w-4 h-4" /> {o.label}
          </button>
        ))}
      </div>

      {onglet === 'apercu' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card variant="glass">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#007AFF] flex items-center justify-center mb-2"><BedDouble className="w-4 h-4" /></div>
              <p className="text-lg font-bold text-slate-900">{chambresDisponibles}/{chambres.length}</p>
              <p className="text-xs text-slate-500">Chambres disponibles</p>
            </Card>
            <Card variant="glass">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center mb-2"><PercentCircle className="w-4 h-4" /></div>
              <p className="text-lg font-bold text-slate-900">{tauxOccupation}%</p>
              <p className="text-xs text-slate-500">Taux d'occupation</p>
            </Card>
            <Card variant="glass">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-2"><CalendarCheck className="w-4 h-4" /></div>
              <p className="text-lg font-bold text-slate-900">{reservationsValides.length}</p>
              <p className="text-xs text-slate-500">Réservations</p>
            </Card>
            <Card variant="glass">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2"><TrendingUp className="w-4 h-4" /></div>
              <p className="text-lg font-bold text-slate-900">{chiffreAffaires.toLocaleString('fr-FR')} <span className="text-xs font-medium text-slate-400">XOF</span></p>
              <p className="text-xs text-slate-500">Revenus</p>
            </Card>
          </div>

          <Card variant="glass">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-[#007AFF]" />
              <h3 className="text-sm font-bold text-slate-800">Prochaines réservations</h3>
            </div>
            {reservationsErreur ? (
              <p className="text-xs text-red-500 py-4 text-center flex items-center justify-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />Impossible de charger vos réservations.</p>
            ) : prochainesReservations.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Aucune réservation à venir.</p>
            ) : (
              <ul className="space-y-2.5">
                {prochainesReservations.map((r) => (
                  <li key={r._id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">
                        {typeof r.client === 'object' ? `${r.client.prenom} ${r.client.nom}` : 'Client'} · {typeof r.chambre === 'object' ? r.chambre.type : 'Chambre'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(r.dateArrivee).toLocaleDateString('fr-FR')} → {new Date(r.dateDepart).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Badge tone={r.statut === 'confirmée' ? 'success' : 'warning'} size="sm" className="capitalize flex-shrink-0">{r.statut}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Button onClick={ouvrirCreationChambre} fullWidth size="lg" icon={<Plus className="w-4 h-4" />}>Ajouter une chambre</Button>
        </div>
      )}

      {onglet === 'chambres' && (
        <div>
          <Button onClick={ouvrirCreationChambre} variant="outline" fullWidth className="mb-4" icon={<Plus className="w-4 h-4" />}>Ajouter une chambre</Button>

          {chambres.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">Aucune chambre pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {chambres.map((c) => (
                <Card key={c._id} variant="glass" padding="sm" className="flex gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {c.photos?.[0] ? <img src={c.photos[0]} alt={c.type} className="w-full h-full object-cover" /> : <BedDouble className="w-5 h-5 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{c.type}</p>
                    <p className="text-xs text-slate-400 mb-1">{c.capacite} pers.</p>
                    <p className="text-sm font-bold text-slate-900">{c.prixParNuit.toLocaleString('fr-FR')} XOF / nuit</p>
                    {!c.disponible && <Badge tone="danger" size="sm" className="mt-1">Hors service</Badge>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => ouvrirEditionChambre(c)} className="p-1.5 rounded-lg hover:bg-slate-100"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                    <button onClick={() => handleSupprimerChambre(c._id)} disabled={suppressionId === c._id} className="p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                  </div>
                </Card>
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
              <Card key={r._id} variant="glass">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-slate-900">{typeof r.client === 'object' ? `${r.client.prenom} ${r.client.nom}` : 'Client'}</p>
                  <p className="text-sm font-bold text-slate-900">{r.montantTotal.toLocaleString('fr-FR')} XOF</p>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  {typeof r.chambre === 'object' ? r.chambre.type : 'Chambre'} · {new Date(r.dateArrivee).toLocaleDateString('fr-FR')} → {new Date(r.dateDepart).toLocaleDateString('fr-FR')} ({r.nombreNuits} nuit{r.nombreNuits > 1 ? 's' : ''})
                </p>
                <Select
                  value={r.statut}
                  onChange={(e) => handleChangerStatut(r._id, e.target.value as Reservation['statut'])}
                  disabled={majStatutId === r._id}
                  className="!py-1.5 !text-xs"
                >
                  {STATUTS_RESERVATION.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </Select>
              </Card>
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
        <Modal open onClose={() => setChambreModal(null)} title={chambreModal.mode === 'creation' ? 'Nouvelle chambre' : 'Modifier la chambre'}>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Photos <span className="text-slate-400 normal-case font-normal">({chambreModal.chambre.photos.filter(Boolean).length}/{MAX_PHOTOS_CHAMBRE})</span>
                </p>
                {chambreModal.chambre.photos.length < MAX_PHOTOS_CHAMBRE && (
                  <button type="button" onClick={() => setChambreModal((m) => m && { ...m, chambre: { ...m.chambre, photos: [...m.chambre.photos, ''] } })} className="flex items-center gap-1 text-xs font-medium text-[#007AFF] hover:text-blue-700 transition-colors px-2.5 py-1 rounded-lg hover:bg-blue-50">
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(chambreModal.chambre.photos.length > 0 ? chambreModal.chambre.photos : ['']).map((url, idx) => (
                  <div key={idx} className={`relative group rounded-xl border-2 border-dashed overflow-hidden aspect-square ${url ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white/50 hover:border-[#007AFF] hover:bg-blue-50/30'}`}>
                    <ImageUploader
                      currentImage={url}
                      onUpload={(nouvelleUrl) => setChambreModal((m) => {
                        if (!m) return m;
                        const photos = [...m.chambre.photos];
                        if (photos.length === 0) photos.push(nouvelleUrl); else photos[idx] = nouvelleUrl;
                        return { ...m, chambre: { ...m.chambre, photos } };
                      })}
                    />
                    {idx === 0 && url && <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-[#007AFF] text-white text-[9px] font-bold rounded-full pointer-events-none">COUVERTURE</div>}
                    {chambreModal.chambre.photos.length > 1 && (
                      <button type="button" onClick={() => setChambreModal((m) => m && { ...m, chambre: { ...m.chambre, photos: m.chambre.photos.filter((_, i) => i !== idx) } })} className="glass-control absolute top-1.5 right-1.5 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all" aria-label="Supprimer">
                        <Minus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Input value={chambreModal.chambre.type} onChange={(e) => setChambreModal((m) => m && { ...m, chambre: { ...m.chambre, type: e.target.value } })} placeholder="Type (ex : Chambre double)" />

            <div className="grid grid-cols-2 gap-3">
              <Input type="number" value={chambreModal.chambre.prixParNuit} onChange={(e) => setChambreModal((m) => m && { ...m, chambre: { ...m.chambre, prixParNuit: e.target.value } })} placeholder="Prix / nuit (XOF)" />
              <Input type="number" value={chambreModal.chambre.capacite} onChange={(e) => setChambreModal((m) => m && { ...m, chambre: { ...m.chambre, capacite: e.target.value } })} placeholder="Capacité (pers.)" />
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

            <Button onClick={handleSauverChambre} loading={chambreEnvoi} fullWidth icon={<Check className="w-4 h-4" />}>
              {chambreModal.mode === 'creation' ? 'Ajouter la chambre' : 'Enregistrer'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MonHotel;
