import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, MapPin, BedDouble, AlertCircle, Loader2, Check, ArrowLeft, X as XIcon, MessageCircle } from 'lucide-react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useContacter } from '../../hooks/useContacter';
import type { Hotel, Chambre } from '../../types';

const MS_PAR_JOUR = 1000 * 60 * 60 * 24;

const HotelPublique = () => {
  const { id } = useParams<{ id: string }>();
  const { isConnected } = useAuth();
  const { contacter, contactEnCours, contactErreur } = useContacter();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');

  const [chambreChoisie, setChambreChoisie] = useState<Chambre | null>(null);
  const [dateArrivee, setDateArrivee] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [reservationErreur, setReservationErreur] = useState('');
  const [reservationReussie, setReservationReussie] = useState(false);

  useEffect(() => {
    let annule = false;
    setLoading(true);
    setErreur('');
    API.get(`/hotels/${id}`)
      .then(({ data }) => { if (!annule) { setHotel(data.hotel); setChambres(data.chambres); } })
      .catch(() => { if (!annule) setErreur("Cet établissement est introuvable ou n'est plus actif."); })
      .finally(() => { if (!annule) setLoading(false); });
    return () => { annule = true; };
  }, [id]);

  const nombreNuits = dateArrivee && dateDepart
    ? Math.round((new Date(dateDepart).getTime() - new Date(dateArrivee).getTime()) / MS_PAR_JOUR)
    : 0;
  const totalSejour = chambreChoisie && nombreNuits > 0 ? nombreNuits * chambreChoisie.prixParNuit : 0;

  const ouvrirReservation = (c: Chambre) => {
    setChambreChoisie(c);
    setDateArrivee('');
    setDateDepart('');
    setReservationErreur('');
    setReservationReussie(false);
  };

  const handleReserver = async () => {
    if (!chambreChoisie || !dateArrivee || !dateDepart) {
      setReservationErreur('Choisissez vos dates de séjour.');
      return;
    }
    if (nombreNuits <= 0) {
      setReservationErreur('La date de départ doit être après la date d\'arrivée.');
      return;
    }
    setEnvoi(true);
    setReservationErreur('');
    try {
      await API.post('/reservations', { chambreId: chambreChoisie._id, dateArrivee, dateDepart });
      setReservationReussie(true);
    } catch (err: any) {
      setReservationErreur(err.response?.data?.message || 'Erreur lors de la réservation.');
    } finally {
      setEnvoi(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="h-8 w-8 border-2 border-blue-200 border-t-[#007AFF] rounded-full animate-spin" /></div>;

  if (erreur || !hotel) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <AlertCircle className="w-10 h-10 text-slate-300" />
        <p className="text-slate-500 font-medium">{erreur}</p>
        <Link to="/hotels" className="text-sm font-semibold text-[#007AFF] hover:underline">Retour aux établissements</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      <Link to="/hotels" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#007AFF] mb-4 transition">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <div className="rounded-2xl p-5 mb-5 text-white relative overflow-hidden" style={{ backgroundColor: hotel.couleurPrincipale || '#007AFF' }}>
        {hotel.photos?.[0] && <img src={hotel.photos[0]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden flex-shrink-0">
            {hotel.logo ? <img src={hotel.logo} alt={hotel.nom} className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6" />}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-lg truncate">{hotel.nom}</h1>
            {hotel.localisation?.ville && <p className="text-xs opacity-90 flex items-center gap-1"><MapPin className="w-3 h-3" /> {hotel.localisation.ville}</p>}
          </div>
        </div>
        {hotel.description && <p className="relative text-sm opacity-90 mt-3">{hotel.description}</p>}
        {hotel.equipements?.length > 0 && (
          <div className="relative flex flex-wrap gap-1.5 mt-3">
            {hotel.equipements.map((eq) => <span key={eq} className="text-[11px] bg-white/20 backdrop-blur rounded-full px-2.5 py-1">{eq}</span>)}
          </div>
        )}
        {typeof hotel.proprietaire === 'object' && (
          <div className="relative flex items-center justify-between mt-3">
            <p className="text-xs opacity-75">Hôtelier : {hotel.proprietaire.prenom} {hotel.proprietaire.nom}</p>
            {isConnected && (
              <button
                onClick={() => contacter((hotel.proprietaire as { _id: string })._id, 'chambre', hotel._id, hotel.nom)}
                disabled={contactEnCours}
                className="flex items-center gap-1.5 text-xs font-semibold bg-white/20 backdrop-blur px-3 py-1.5 rounded-full hover:bg-white/30 transition disabled:opacity-60"
              >
                {contactEnCours ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />} Contacter
              </button>
            )}
          </div>
        )}
      </div>

      {contactErreur && (
        <p className="text-xs text-red-500 mb-3 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{contactErreur}</p>
      )}

      {chambres.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-16">Aucune chambre disponible pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {chambres.map((c) => (
            <div key={c._id} className="glass rounded-2xl overflow-hidden">
              <div className="h-28 bg-slate-100 flex items-center justify-center overflow-hidden">
                {c.photos?.[0] ? <img src={c.photos[0]} alt={c.type} className="w-full h-full object-cover" /> : <BedDouble className="w-6 h-6 text-slate-300" />}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-slate-900">{c.type}</p>
                <p className="text-xs text-slate-400 mb-2">{c.capacite} personne{c.capacite > 1 ? 's' : ''}</p>
                <p className="text-sm font-bold text-slate-900 mb-2">{c.prixParNuit.toLocaleString('fr-FR')} XOF / nuit</p>
                <button onClick={() => ouvrirReservation(c)} className="w-full text-xs font-semibold text-white bg-[#007AFF] hover:bg-blue-600 transition rounded-lg py-1.5">Réserver</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {chambreChoisie && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => !envoi && setChambreChoisie(null)}>
          <div className="w-full max-w-md glass rounded-3xl shadow-2xl p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {reservationReussie ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center"><Check className="w-7 h-7 text-emerald-500" /></div>
                <p className="font-semibold text-slate-900">Demande de réservation envoyée !</p>
                <p className="text-sm text-slate-500">{hotel.nom} va confirmer votre réservation sous peu.</p>
                <button onClick={() => setChambreChoisie(null)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition">Fermer</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-slate-900">Réserver — {chambreChoisie.type}</h2>
                  <button onClick={() => setChambreChoisie(null)} className="p-1.5 rounded-full hover:bg-slate-100"><XIcon className="w-4 h-4 text-slate-500" /></button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Arrivée</label>
                    <input type="date" value={dateArrivee} min={new Date().toISOString().split('T')[0]} onChange={(e) => setDateArrivee(e.target.value)} className="w-full px-3 py-2.5 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Départ</label>
                    <input type="date" value={dateDepart} min={dateArrivee || new Date().toISOString().split('T')[0]} onChange={(e) => setDateDepart(e.target.value)} className="w-full px-3 py-2.5 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>

                {nombreNuits > 0 && (
                  <div className="flex items-center justify-between text-sm mb-4 bg-blue-50 rounded-xl px-3 py-2.5">
                    <span className="text-slate-600">{nombreNuits} nuit{nombreNuits > 1 ? 's' : ''}</span>
                    <span className="font-bold text-slate-900">{totalSejour.toLocaleString('fr-FR')} XOF</span>
                  </div>
                )}

                {!isConnected && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <Link to="/connexion" className="underline font-semibold">Connectez-vous</Link>&nbsp;pour réserver.
                  </p>
                )}

                {reservationErreur && <p className="text-xs text-red-500 flex items-center gap-1.5 mb-3"><AlertCircle className="w-3.5 h-3.5" />{reservationErreur}</p>}

                <button onClick={handleReserver} disabled={!isConnected || envoi} className="w-full py-3.5 bg-[#007AFF] text-white rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {envoi && <Loader2 className="w-4 h-4 animate-spin" />} Demander la réservation
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelPublique;
