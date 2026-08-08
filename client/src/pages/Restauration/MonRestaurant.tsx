import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed, Plus, Minus, Pencil, Trash2, ShoppingBag, AlertCircle,
  Check, ExternalLink, Flame, Bike, Crown, LayoutDashboard, TrendingUp,
  BarChart3, Sparkles, Clock,
} from 'lucide-react';
import API from '../../api/axios';
import { Spinner, Modal, Card, Button, Input, Textarea, Select, Badge } from '../../components/ui';
import ImageUploader from '../../components/ImageUploader';
import AbonnementProWidget from '../../components/AbonnementProWidget/AbonnementProWidget';
import { CATEGORIES_PLAT, getCategoriePlatColor } from '../../utils/categoriesPlat';
import type { Restaurant, Plat, CommandeRestaurant, DemandeLivraison, AbonnementPro } from '../../types';

const MAX_PHOTOS_PLAT = 10;

type Onglet = 'apercu' | 'carte' | 'commandes' | 'horaires' | 'parametres';

const STATUTS_COMMANDE: CommandeRestaurant['statut'][] = ['en_attente', 'en_préparation', 'prête', 'livrée', 'annulée'];

const platVide = { nom: '', description: '', categorie: '', prix: '', photos: [] as string[], epice: false, disponible: true, estMisEnAvant: false };

const JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
type Horaire = { jour: string; ouverture: string; fermeture: string; ferme: boolean };
const horairesParDefaut = (): Horaire[] => JOURS_SEMAINE.map((jour) => ({ jour, ouverture: '08:00', fermeture: '20:00', ferme: false }));

const MonRestaurant = () => {
  const [chargement, setChargement] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [erreur, setErreur] = useState('');
  const [onglet, setOnglet] = useState<Onglet>('apercu');

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

  // ─── Horaires (endpoint PUT /restaurants/moi déjà existant côté backend,
  // simplement jamais exposé jusqu'ici dans l'interface) ───
  const [horaires, setHoraires] = useState<Horaire[]>(horairesParDefaut());
  const [horairesEnvoi, setHorairesEnvoi] = useState(false);
  const [horairesMessage, setHorairesMessage] = useState('');

  const charger = useCallback(() => {
    setChargement(true);
    setErreur('');
    API.get('/restaurants/moi')
      .then(({ data }) => {
        setRestaurant(data.restaurant);
        setPlats(data.plats);
        if (data.restaurant.horaires?.length) setHoraires(data.restaurant.horaires);
      })
      .catch((err) => { if (err.response?.status !== 404) setErreur('Impossible de charger votre restaurant.'); })
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => { charger(); }, [charger]);

  // Chargées dès que le restaurant existe, pas seulement à l'ouverture de
  // l'onglet "Commandes" : l'aperçu a besoin de ces données immédiatement.
  useEffect(() => {
    if (!restaurant) return;
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
  }, [restaurant]);

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

  const ouvrirCreationPlat = () => { setPlatErreur(''); setPlatModal({ mode: 'creation', plat: { ...platVide } }); setOnglet('carte'); };

  const ouvrirEditionPlat = (p: Plat) => {
    setPlatErreur('');
    setPlatModal({
      mode: 'edition', id: p._id,
      plat: { nom: p.nom, description: p.description, categorie: p.categorie, prix: String(p.prix), photos: p.photos || [], epice: p.epice, disponible: p.disponible, estMisEnAvant: p.estMisEnAvant },
    });
  };

  const handleSauverPlat = async () => {
    if (!platModal) return;
    const { nom, categorie, prix } = platModal.plat;
    if (!nom.trim() || !categorie || !prix) { setPlatErreur('Nom, catégorie et prix sont obligatoires.'); return; }
    setPlatEnvoi(true);
    setPlatErreur('');
    const payload = {
      ...platModal.plat,
      prix: Number(platModal.plat.prix),
      photos: platModal.plat.photos.filter((url) => url && url.trim() !== ''),
    };
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

  const handleSauverHoraires = async () => {
    if (!restaurant) return;
    setHorairesEnvoi(true);
    setHorairesMessage('');
    try {
      const { data } = await API.put('/restaurants/moi', { horaires });
      setRestaurant(data);
      setHorairesMessage('Horaires mis à jour avec succès.');
    } catch {
      setHorairesMessage("Erreur lors de l'enregistrement des horaires.");
    } finally {
      setHorairesEnvoi(false);
    }
  };

  // ─── Statistiques dérivées des commandes déjà chargées (aucun nouvel appel) ───
  const commandesValides = useMemo(() => commandes.filter((c) => c.statut !== 'annulée'), [commandes]);
  const aujourdHui = new Date().toISOString().slice(0, 10);
  const commandesDuJour = useMemo(() => commandesValides.filter((c) => c.createdAt.slice(0, 10) === aujourdHui), [commandesValides, aujourdHui]);
  const revenusDuJour = useMemo(() => commandesDuJour.reduce((s, c) => s + c.montantTotal, 0), [commandesDuJour]);
  const chiffreAffaires = useMemo(() => commandesValides.reduce((s, c) => s + c.montantTotal, 0), [commandesValides]);

  const commandesParJour = useMemo(() => {
    const jours: { label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const cle = d.toISOString().slice(0, 10);
      const total = commandesValides.filter((c) => c.createdAt.slice(0, 10) === cle).reduce((s, c) => s + c.montantTotal, 0);
      jours.push({ label: d.toLocaleDateString('fr-FR', { weekday: 'short' }), total });
    }
    return jours;
  }, [commandesValides]);
  const maxJour = Math.max(1, ...commandesParJour.map((j) => j.total));

  const platsPopulaires = useMemo(() => {
    const compte: Record<string, { nom: string; quantite: number }> = {};
    commandesValides.forEach((c) => {
      c.articles.forEach((a) => {
        const cle = a.plat || a.nom;
        if (!compte[cle]) compte[cle] = { nom: a.nom, quantite: 0 };
        compte[cle].quantite += a.quantite;
      });
    });
    return Object.values(compte).sort((a, b) => b.quantite - a.quantite).slice(0, 5);
  }, [commandesValides]);

  if (chargement) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Spinner size="lg" /></div>;
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
          <Input value={creationForm.nom} onChange={(e) => setCreationForm({ ...creationForm, nom: e.target.value })} placeholder="Nom du restaurant" />
          <Textarea value={creationForm.description} onChange={(e) => setCreationForm({ ...creationForm, description: e.target.value })} placeholder="Décrivez votre cuisine" rows={3} />
          <Input value={creationForm.ville} onChange={(e) => setCreationForm({ ...creationForm, ville: e.target.value })} placeholder="Ville" />
          {creationErreur && <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{creationErreur}</p>}
          <Button type="submit" loading={creationEnCours} fullWidth size="lg">Créer mon restaurant</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      <Card variant="glass-solid" className="mb-5 flex items-center gap-4">
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
      </Card>

      {erreur && <p className="text-xs text-red-500 mb-4 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{erreur}</p>}

      <div className="flex gap-1 p-1 rounded-xl glass-light mb-5 w-fit overflow-x-auto">
        {([
          { id: 'apercu', label: 'Aperçu', icon: LayoutDashboard },
          { id: 'carte', label: 'Carte', icon: UtensilsCrossed },
          { id: 'commandes', label: 'Commandes', icon: ShoppingBag },
          { id: 'horaires', label: 'Horaires', icon: Clock },
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
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#007AFF] flex items-center justify-center mb-2"><ShoppingBag className="w-4 h-4" /></div>
              <p className="text-lg font-bold text-slate-900">{commandesDuJour.length}</p>
              <p className="text-xs text-slate-500">Commandes aujourd'hui</p>
            </Card>
            <Card variant="glass">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2"><TrendingUp className="w-4 h-4" /></div>
              <p className="text-lg font-bold text-slate-900">{revenusDuJour.toLocaleString('fr-FR')} <span className="text-xs font-medium text-slate-400">XOF</span></p>
              <p className="text-xs text-slate-500">Revenus du jour</p>
            </Card>
            <Card variant="glass">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-2"><UtensilsCrossed className="w-4 h-4" /></div>
              <p className="text-lg font-bold text-slate-900">{plats.length}</p>
              <p className="text-xs text-slate-500">Plats à la carte</p>
            </Card>
            <Card variant="glass">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center mb-2"><TrendingUp className="w-4 h-4" /></div>
              <p className="text-lg font-bold text-slate-900">{chiffreAffaires.toLocaleString('fr-FR')} <span className="text-xs font-medium text-slate-400">XOF</span></p>
              <p className="text-xs text-slate-500">Revenus totaux</p>
            </Card>
          </div>

          <Card variant="glass">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[#007AFF]" />
              <h3 className="text-sm font-bold text-slate-800">Revenus des 7 derniers jours</h3>
            </div>
            <div className="flex items-end justify-between gap-2 h-32">
              {commandesParJour.map((j, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex-1 flex items-end">
                    <div className="w-full rounded-t-lg bg-gradient-to-t from-[#007AFF] to-[#5E5CE6] transition-all duration-500" style={{ height: `${Math.max(4, (j.total / maxJour) * 100)}%` }} title={`${j.total.toLocaleString('fr-FR')} XOF`} />
                  </div>
                  <span className="text-[10px] text-slate-400 capitalize">{j.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="glass">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800">Plats populaires</h3>
            </div>
            {platsPopulaires.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Pas encore de commandes.</p>
            ) : (
              <ul className="space-y-2">
                {platsPopulaires.map((p, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 truncate">{i + 1}. {p.nom}</span>
                    <Badge tone="primary" size="sm">{p.quantite} commandé{p.quantite > 1 ? 's' : ''}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Button onClick={ouvrirCreationPlat} fullWidth size="lg" icon={<Plus className="w-4 h-4" />}>Ajouter un plat</Button>
        </div>
      )}

      {onglet === 'carte' && (
        <div>
          <Button onClick={ouvrirCreationPlat} variant="outline" fullWidth className="mb-4" icon={<Plus className="w-4 h-4" />}>Ajouter un plat</Button>

          {plats.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">Votre carte est vide pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plats.map((p) => (
                <Card key={p._id} variant="glass" padding="sm" className="flex gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {p.photos?.[0] ? <img src={p.photos[0]} alt={p.nom} className="w-full h-full object-cover" /> : <UtensilsCrossed className="w-5 h-5 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-900 truncate">{p.nom}</p>
                      {p.epice && <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs font-medium mb-1" style={{ color: getCategoriePlatColor(p.categorie) }}>{p.categorie}</p>
                    <p className="text-sm font-bold text-slate-900">{p.prix.toLocaleString('fr-FR')} XOF</p>
                    {!p.disponible && <Badge tone="danger" size="sm" className="mt-1">Indisponible</Badge>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => ouvrirEditionPlat(p)} className="p-1.5 rounded-lg hover:bg-slate-100"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                    <button onClick={() => handleSupprimerPlat(p._id)} disabled={suppressionId === p._id} className="p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                  </div>
                </Card>
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
              <Card key={c._id} variant="glass">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-900">{typeof c.client === 'object' ? `${c.client.prenom} ${c.client.nom}` : 'Client'}</p>
                  <p className="text-sm font-bold text-slate-900">{c.montantTotal.toLocaleString('fr-FR')} XOF</p>
                </div>
                <p className="text-xs text-slate-400 mb-2 capitalize">{c.modeService.replace('_', ' ')}</p>
                <ul className="text-xs text-slate-500 mb-3 space-y-0.5">
                  {c.articles.map((a, i) => <li key={i}>{a.quantite} × {a.nom}</li>)}
                </ul>
                <Select
                  value={c.statut}
                  onChange={(e) => handleChangerStatut(c._id, e.target.value as CommandeRestaurant['statut'])}
                  disabled={majStatutId === c._id}
                  className="!py-1.5 !text-xs"
                >
                  {STATUTS_COMMANDE.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </Select>

                {c.modeService === 'livraison' && (
                  <div className="mt-2">
                    {demandesLivraison[c._id] ? (
                      <Badge tone="primary" size="md" className="!py-1.5">
                        <Bike className="w-3.5 h-3.5" /> Livreur : {demandesLivraison[c._id].statut.replace('_', ' ')}
                      </Badge>
                    ) : (
                      <Button onClick={() => handleDemanderLivreur(c._id)} loading={demandeEnCoursId === c._id} variant="outline" size="sm" icon={<Bike className="w-3.5 h-3.5" />}>
                        Demander un livreur
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {onglet === 'horaires' && (
        <Card variant="glass" className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#007AFF]" />
            <h3 className="text-sm font-bold text-slate-800">Horaires d'ouverture</h3>
          </div>
          <div className="space-y-2">
            {horaires.map((h, i) => (
              <div key={h.jour} className="flex items-center gap-2 sm:gap-3">
                <span className="w-16 sm:w-20 text-xs sm:text-sm font-medium text-slate-600 flex-shrink-0">{h.jour}</span>
                {h.ferme ? (
                  <span className="flex-1 text-xs text-slate-400 italic">Fermé</span>
                ) : (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="time"
                      value={h.ouverture}
                      onChange={(e) => setHoraires((prev) => prev.map((x, idx) => idx === i ? { ...x, ouverture: e.target.value } : x))}
                      className="px-2 py-1.5 bg-slate-100/70 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <span className="text-slate-300">—</span>
                    <input
                      type="time"
                      value={h.fermeture}
                      onChange={(e) => setHoraires((prev) => prev.map((x, idx) => idx === i ? { ...x, fermeture: e.target.value } : x))}
                      className="px-2 py-1.5 bg-slate-100/70 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                )}
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={h.ferme}
                    onChange={(e) => setHoraires((prev) => prev.map((x, idx) => idx === i ? { ...x, ferme: e.target.checked } : x))}
                    className="w-3.5 h-3.5 rounded accent-[#007AFF]"
                  />
                  Fermé
                </label>
              </div>
            ))}
          </div>
          {horairesMessage && (
            <p className={`text-xs flex items-center gap-1.5 ${horairesMessage.includes('succès') ? 'text-emerald-600' : 'text-red-500'}`}>
              {horairesMessage.includes('succès') ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {horairesMessage}
            </p>
          )}
          <Button onClick={handleSauverHoraires} loading={horairesEnvoi} fullWidth icon={<Check className="w-4 h-4" />}>
            Enregistrer les horaires
          </Button>
        </Card>
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
        <Modal open onClose={() => setPlatModal(null)} title={platModal.mode === 'creation' ? 'Nouveau plat' : 'Modifier le plat'}>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Photos <span className="text-slate-400 normal-case font-normal">({platModal.plat.photos.filter(Boolean).length}/{MAX_PHOTOS_PLAT})</span>
                </p>
                {platModal.plat.photos.length < MAX_PHOTOS_PLAT && (
                  <button type="button" onClick={() => setPlatModal((m) => m && { ...m, plat: { ...m.plat, photos: [...m.plat.photos, ''] } })} className="flex items-center gap-1 text-xs font-medium text-[#007AFF] hover:text-blue-700 transition-colors px-2.5 py-1 rounded-lg hover:bg-blue-50">
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(platModal.plat.photos.length > 0 ? platModal.plat.photos : ['']).map((url, idx) => (
                  <div key={idx} className={`relative group rounded-xl border-2 border-dashed overflow-hidden aspect-square ${url ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white/50 hover:border-[#007AFF] hover:bg-blue-50/30'}`}>
                    <ImageUploader
                      currentImage={url}
                      onUpload={(nouvelleUrl) => setPlatModal((m) => {
                        if (!m) return m;
                        const photos = [...m.plat.photos];
                        if (photos.length === 0) photos.push(nouvelleUrl); else photos[idx] = nouvelleUrl;
                        return { ...m, plat: { ...m.plat, photos } };
                      })}
                    />
                    {idx === 0 && url && <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-[#007AFF] text-white text-[9px] font-bold rounded-full pointer-events-none">COUVERTURE</div>}
                    {platModal.plat.photos.length > 1 && (
                      <button type="button" onClick={() => setPlatModal((m) => m && { ...m, plat: { ...m.plat, photos: m.plat.photos.filter((_, i) => i !== idx) } })} className="glass-control absolute top-1.5 right-1.5 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all" aria-label="Supprimer">
                        <Minus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Input value={platModal.plat.nom} onChange={(e) => setPlatModal((m) => m && { ...m, plat: { ...m.plat, nom: e.target.value } })} placeholder="Nom du plat" />
            <Textarea value={platModal.plat.description} onChange={(e) => setPlatModal((m) => m && { ...m, plat: { ...m.plat, description: e.target.value } })} placeholder="Description" rows={2} />

            <Select value={platModal.plat.categorie} onChange={(e) => setPlatModal((m) => m && { ...m, plat: { ...m.plat, categorie: e.target.value } })}>
              <option value="">Choisir une catégorie</option>
              {CATEGORIES_PLAT.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>

            <Input type="number" value={platModal.plat.prix} onChange={(e) => setPlatModal((m) => m && { ...m, plat: { ...m.plat, prix: e.target.value } })} placeholder="Prix (XOF)" />

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

            <Button onClick={handleSauverPlat} loading={platEnvoi} fullWidth icon={<Check className="w-4 h-4" />}>
              {platModal.mode === 'creation' ? 'Ajouter le plat' : 'Enregistrer'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MonRestaurant;
