import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed, Plus, Pencil, Trash2, ShoppingBag, AlertCircle,
  X as XIcon, Check, ExternalLink, Loader2, Flame, Bike, Crown
} from 'lucide-react';
import API from '../../api/axios';
import ImageUploader from '../../components/ImageUploader';
import AbonnementProWidget from '../../components/AbonnementProWidget/AbonnementProWidget';
import { CATEGORIES_PLAT, getCategoriePlatColor } from '../../utils/categoriesPlat';
import type { Restaurant, Plat, CommandeRestaurant, DemandeLivraison, AbonnementPro } from '../../types';

type Onglet = 'plats' | 'commandes' | 'parametres';

const STATUTS_COMMANDE: CommandeRestaurant['statut'][] = ['en_attente', 'en_préparation', 'prête', 'livrée', 'annulée'];

const platVide = { nom: '', description: '', categorie: '', prix: '', photo: '', epice: false, disponible: true, estMisEnAvant: false };

const MonRestaurant = () => {
  const [chargement, setChargement] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [erreur, setErreur] = useState('');
  const [onglet, setOnglet] = useState<Onglet>('plats');

  const [creationForm, setCreationForm] = useState({ nom: '', description: '', ville: '' });
  const [creationEnCours, setCreationEnCours] = useState(false);
  const [creationErreur, setCreationErreur] = useState('');

  const [platModal, setPlatModal] = useState<{ mode: 'creation' | 'edition'; plat: typeof platVide; id?: string } | null>(null);
  const [platEnvoi, setPlatEnvoi] = useState(false);
  const [platErreur, setPlatErreur] = useState('');
  const [suppressionId, setSuppressionId] = useState<string | null>(null);

  const [commandes, setCommandes] = useState<CommandeRestaurant[]>([]);
  const [commandesErreur, setCommandesErreur] = useState(false);
  const [majStatutId, setMajStatutId] = useState<string | null>(null);

  const [demandesLivraison, setDemandesLivraison] = useState<Record<string, DemandeLivraison>>({});
  const [demandeEnCoursId, setDemandeEnCoursId] = useState<string | null>(null);

  const charger = useCallback(() => {
    setChargement(true);
    setErreur('');
    API.get('/restaurants/moi')
      .then(({ data }) => { setRestaurant(data.restaurant); setPlats(data.plats); })
      .catch((err) => { if (err.response?.status !== 404) setErreur('Impossible de charger votre restaurant.'); })
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => { charger(); }, [charger]);

  useEffect(() => {
    if (onglet !== 'commandes' || !restaurant) return;
    setCommandesErreur(false);
    API.get('/commandes-restaurant/recues')
      .then(({ data }) => setCommandes(data))
      .catch(() => setCommandesErreur(true));
    API.get('/demandes-livraison/mes-demandes')
      .then(({ data }) => {
        const parSource: Record<string, DemandeLivraison> = {};
        (data as DemandeLivraison[]).forEach((d) => { if (d.sourceType === 'restauration') parSource[d.sourceId] = d; });
        setDemandesLivraison(parSource);
      })
      .catch(() => {});
  }, [onglet, restaurant]);

  const handleCreer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creationForm.nom.trim()) { setCreationErreur('Le nom du restaurant est obligatoire.'); return; }
    setCreationEnCours(true);
    setCreationErreur('');
    try {
      const { data } = await API.post('/restaurants', {
        nom: creationForm.nom, description: creationForm.description,
        localisation: { ville: creationForm.ville },
      });
      setRestaurant(data);
    } catch (err: any) {
      setCreationErreur(err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setCreationEnCours(false);
    }
  };

  const ouvrirCreationPlat = () => { setPlatErreur(''); setPlatModal({ mode: 'creation', plat: { ...platVide } }); };

  const ouvrirEditionPlat = (p: Plat) => {
    setPlatErreur('');
    setPlatModal({
      mode: 'edition', id: p._id,
      plat: { nom: p.nom, description: p.description, categorie: p.categorie, prix: String(p.prix), photo: p.photo, epice: p.epice, disponible: p.disponible, estMisEnAvant: p.estMisEnAvant },
    });
  };

  const handleSauverPlat = async () => {
    if (!platModal) return;
    const { nom, categorie, prix } = platModal.plat;
    if (!nom.trim() || !categorie || !prix) { setPlatErreur('Nom, catégorie et prix sont obligatoires.'); return; }
    setPlatEnvoi(true);
    setPlatErreur('');
    const payload = { ...platModal.plat, prix: Number(platModal.plat.prix) };
    try {
      if (platModal.mode === 'creation') {
        const { data } = await API.post('/plats', payload);
        setPlats((prev) => [data, ...prev]);
      } else {
        const { data } = await API.put(`/plats/${platModal.id}`, payload);
        setPlats((prev) => prev.map((p) => (p._id === data._id ? data : p)));
      }
      setPlatModal(null);
    } catch (err: any) {
      setPlatErreur(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setPlatEnvoi(false);
    }
  };

  const handleSupprimerPlat = async (id: string) => {
    setSuppressionId(id);
    try {
      await API.delete(`/plats/${id}`);
      setPlats((prev) => prev.filter((p) => p._id !== id));
    } catch {
      setErreur('Impossible de supprimer ce plat. Réessayez.');
    } finally {
      setSuppressionId(null);
    }
  };

  const handleChangerStatut = async (id: string, statut: CommandeRestaurant['statut']) => {
    setMajStatutId(id);
    try {
      const { data } = await API.put(`/commandes-restaurant/${id}/statut`, { statut });
      setCommandes((prev) => prev.map((c) => (c._id === data._id ? data : c)));
    } catch {
      setCommandesErreur(true);
    } finally {
      setMajStatutId(null);
    }
  };

  const handleDemanderLivreur = async (commandeId: string) => {
    if (!restaurant) return;
    setDemandeEnCoursId(commandeId);
    try {
      const { data } = await API.post('/demandes-livraison', {
        sourceType: 'restauration',
        sourceId: commandeId,
        adresseRecuperation: restaurant.localisation,
      });
      setDemandesLivraison((prev) => ({ ...prev, [commandeId]: data }));
    } catch (err: any) {
      setErreur(err.response?.data?.message || "Impossible de demander un livreur pour cette commande.");
    } finally {
      setDemandeEnCoursId(null);
    }
  };

  if (chargement) {
    return <div className="flex items-center justify-center min-h-[50vh]"><div className="h-8 w-8 border-2 border-blue-200 border-t-[#007AFF] rounded-full animate-spin" /></div>;
  }

  if (!restaurant) {
    return (
      <div className="max-w-md mx-auto pb-24 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-3">
            <UtensilsCrossed className="w-6 h-6 text-[#007AFF]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Créez votre restaurant</h1>
          <p className="text-sm text-slate-500">Présentez votre carte et recevez des commandes.</p>
        </div>

        <form onSubmit={handleCreer} className="glass rounded-2xl p-5 space-y-4">
          <input
            value={creationForm.nom}
            onChange={(e) => setCreationForm({ ...creationForm, nom: e.target.value })}
            placeholder="Nom du restaurant"
            className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
          <textarea
            value={creationForm.description}
            onChange={(e) => setCreationForm({ ...creationForm, description: e.target.value })}
            placeholder="Décrivez votre cuisine"
            rows={3}
            className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
          <input
            value={creationForm.ville}
            onChange={(e) => setCreationForm({ ...creationForm, ville: e.target.value })}
            placeholder="Ville"
            className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
          {creationErreur && <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{creationErreur}</p>}
          <button type="submit" disabled={creationEnCours} className="w-full py-3.5 bg-[#007AFF] text-white rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-60 flex items-center justify-center gap-2">
            {creationEnCours && <Loader2 className="w-4 h-4 animate-spin" />} Créer mon restaurant
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      <div className="glass rounded-2xl p-5 mb-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {restaurant.logo ? <img src={restaurant.logo} alt={restaurant.nom} className="w-full h-full object-cover" /> : <UtensilsCrossed className="w-6 h-6 text-slate-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-slate-900 truncate">{restaurant.nom}</h1>
          <p className="text-xs text-slate-400">{plats.length} plat{plats.length > 1 ? 's' : ''} à la carte</p>
        </div>
        <Link to={`/restaurant/${restaurant._id}`} target="_blank" className="flex items-center gap-1.5 text-xs font-semibold text-[#007AFF] hover:underline flex-shrink-0">
          Voir la carte <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {erreur && <p className="text-xs text-red-500 mb-4 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{erreur}</p>}

      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 mb-5 w-fit">
        {([{ id: 'plats', label: 'Carte', icon: UtensilsCrossed }, { id: 'commandes', label: 'Commandes', icon: ShoppingBag }, { id: 'parametres', label: 'Abonnement', icon: Crown }] as const).map((o) => (
          <button key={o.id} onClick={() => setOnglet(o.id)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition ${onglet === o.id ? 'bg-white text-[#007AFF] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <o.icon className="w-4 h-4" /> {o.label}
          </button>
        ))}
      </div>

      {onglet === 'plats' && (
        <div>
          <button onClick={ouvrirCreationPlat} className="w-full mb-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:border-[#007AFF] hover:text-[#007AFF] transition flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Ajouter un plat
          </button>

          {plats.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">Votre carte est vide pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plats.map((p) => (
                <div key={p._id} className="glass rounded-2xl p-3 flex gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {p.photo ? <img src={p.photo} alt={p.nom} className="w-full h-full object-cover" /> : <UtensilsCrossed className="w-5 h-5 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-900 truncate">{p.nom}</p>
                      {p.epice && <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs font-medium mb-1" style={{ color: getCategoriePlatColor(p.categorie) }}>{p.categorie}</p>
                    <p className="text-sm font-bold text-slate-900">{p.prix.toLocaleString('fr-FR')} XOF</p>
                    {!p.disponible && <p className="text-[11px] text-red-500">Indisponible</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => ouvrirEditionPlat(p)} className="p-1.5 rounded-lg hover:bg-slate-100"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                    <button onClick={() => handleSupprimerPlat(p._id)} disabled={suppressionId === p._id} className="p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {onglet === 'commandes' && (
        <div className="space-y-3">
          {commandesErreur ? (
            <p className="text-sm text-red-500 flex items-center gap-1.5 py-8 justify-center"><AlertCircle className="w-4 h-4" />Impossible de charger vos commandes.</p>
          ) : commandes.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">Aucune commande reçue pour le moment.</p>
          ) : (
            commandes.map((c) => (
              <div key={c._id} className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-900">{typeof c.client === 'object' ? `${c.client.prenom} ${c.client.nom}` : 'Client'}</p>
                  <p className="text-sm font-bold text-slate-900">{c.montantTotal.toLocaleString('fr-FR')} XOF</p>
                </div>
                <p className="text-xs text-slate-400 mb-2 capitalize">{c.modeService.replace('_', ' ')}</p>
                <ul className="text-xs text-slate-500 mb-3 space-y-0.5">
                  {c.articles.map((a, i) => <li key={i}>{a.quantite} × {a.nom}</li>)}
                </ul>
                <select
                  value={c.statut}
                  onChange={(e) => handleChangerStatut(c._id, e.target.value as CommandeRestaurant['statut'])}
                  disabled={majStatutId === c._id}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 outline-none disabled:opacity-50"
                >
                  {STATUTS_COMMANDE.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>

                {c.modeService === 'livraison' && (
                  <div className="mt-2">
                    {demandesLivraison[c._id] ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-[#007AFF]">
                        <Bike className="w-3.5 h-3.5" /> Livreur : {demandesLivraison[c._id].statut.replace('_', ' ')}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDemanderLivreur(c._id)}
                        disabled={demandeEnCoursId === c._id}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#007AFF] text-[#007AFF] hover:bg-blue-50 transition disabled:opacity-50"
                      >
                        {demandeEnCoursId === c._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bike className="w-3.5 h-3.5" />}
                        Demander un livreur
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {onglet === 'parametres' && restaurant && (
        <AbonnementProWidget
          espaceType="restauration"
          espaceId={restaurant._id}
          abonnementPro={restaurant.abonnementPro}
          onUpdated={(abonnementPro: AbonnementPro) => setRestaurant((r) => r && { ...r, abonnementPro })}
        />
      )}

      {platModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setPlatModal(null)}>
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto glass rounded-3xl shadow-2xl p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">{platModal.mode === 'creation' ? 'Nouveau plat' : 'Modifier le plat'}</h2>
              <button onClick={() => setPlatModal(null)} className="p-1.5 rounded-full hover:bg-slate-100"><XIcon className="w-4 h-4 text-slate-500" /></button>
            </div>

            <div className="space-y-3">
              <ImageUploader currentImage={platModal.plat.photo} onUpload={(url) => setPlatModal((m) => m && { ...m, plat: { ...m.plat, photo: url } })} />

              <input value={platModal.plat.nom} onChange={(e) => setPlatModal((m) => m && { ...m, plat: { ...m.plat, nom: e.target.value } })} placeholder="Nom du plat" className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              <textarea value={platModal.plat.description} onChange={(e) => setPlatModal((m) => m && { ...m, plat: { ...m.plat, description: e.target.value } })} placeholder="Description" rows={2} className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" />

              <select value={platModal.plat.categorie} onChange={(e) => setPlatModal((m) => m && { ...m, plat: { ...m.plat, categorie: e.target.value } })} className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Choisir une catégorie</option>
                {CATEGORIES_PLAT.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <input type="number" value={platModal.plat.prix} onChange={(e) => setPlatModal((m) => m && { ...m, plat: { ...m.plat, prix: e.target.value } })} placeholder="Prix (XOF)" className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />

              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={platModal.plat.epice} onChange={(e) => setPlatModal((m) => m && { ...m, plat: { ...m.plat, epice: e.target.checked } })} className="w-4 h-4 rounded accent-[#007AFF]" />
                Plat épicé
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={platModal.plat.disponible} onChange={(e) => setPlatModal((m) => m && { ...m, plat: { ...m.plat, disponible: e.target.checked } })} className="w-4 h-4 rounded accent-[#007AFF]" />
                Disponible actuellement
              </label>

              {platModal.mode === 'edition' && (
                <label className={`flex items-center gap-2 text-sm ${restaurant?.abonnementPro?.actif ? 'text-slate-600' : 'text-slate-300'}`}>
                  <input
                    type="checkbox"
                    checked={platModal.plat.estMisEnAvant}
                    disabled={!restaurant?.abonnementPro?.actif}
                    onChange={(e) => setPlatModal((m) => m && { ...m, plat: { ...m.plat, estMisEnAvant: e.target.checked } })}
                    className="w-4 h-4 rounded accent-amber-500 disabled:opacity-40"
                  />
                  Mettre en avant {!restaurant?.abonnementPro?.actif && <span className="text-xs text-amber-500 ml-1">(nécessite l'abonnement Pro)</span>}
                </label>
              )}

              {platErreur && <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{platErreur}</p>}

              <button onClick={handleSauverPlat} disabled={platEnvoi} className="w-full py-3.5 bg-[#007AFF] text-white rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {platEnvoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {platModal.mode === 'creation' ? 'Ajouter le plat' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonRestaurant;
