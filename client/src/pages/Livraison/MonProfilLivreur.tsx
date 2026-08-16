import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bike, AlertCircle, Loader2, Check, Power, Package, MapPin, Truck, Crown,
  LayoutDashboard, TrendingUp, Star, Gauge, Navigation, ExternalLink,
} from 'lucide-react';
import API from '../../api/axios';
import { Spinner, Button, Badge, Card, Input } from '../../components/ui';
import AbonnementProWidget from '../../components/AbonnementProWidget/AbonnementProWidget';
import type { Livreur, DemandeLivraison, AbonnementPro, DestinationLivraison as DestinationLivraisonValue } from '../../types';

// ─── Destination d'une livraison, telle que vue par le livreur : la
// description humaine du lieu reste toujours affichée, même quand des
// coordonnées GPS sont disponibles — la position indique un point, la
// description explique comment l'atteindre réellement. ───
const DestinationCard = ({ titre, adresse }: { titre: string; adresse?: DestinationLivraisonValue }) => (
  <div className="glass-light rounded-2xl p-3.5">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{titre}</p>
    <p className="text-sm font-medium text-slate-800 flex items-start gap-1.5 mb-1 leading-snug">
      <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
      <span>{adresse?.details || [adresse?.quartier, adresse?.ville].filter(Boolean).join(', ') || 'Non précisé'}</span>
    </p>
    {adresse?.mapUrl && (
      <a
        href={adresse.mapUrl}
        target="_blank"
        rel="noreferrer"
        className="glass-pill inline-flex items-center gap-1.5 text-xs font-semibold text-primary rounded-full px-3 py-1.5 mt-1.5 no-underline hover:-translate-y-0.5 transition-transform"
      >
        <ExternalLink className="w-3.5 h-3.5" /> Ouvrir dans Maps
      </a>
    )}
  </div>
);

// ─── Timeline de progression d'une course : assignée → en route → arrivée
// → livrée. Les anciens statuts (en_cours, en_attente) sont mappés sur les
// étapes correspondantes pour rester rétrocompatibles. ───
const ETAPES_COURSE: { id: string; label: string }[] = [
  { id: 'assignée', label: 'Assignée' },
  { id: 'en_route', label: 'En route' },
  { id: 'arrivée', label: 'Arrivée' },
  { id: 'livrée', label: 'Livrée' },
];

const indexEtape = (statut: string) => {
  if (statut === 'livrée') return 3;
  if (statut === 'arrivée') return 2;
  if (statut === 'en_route' || statut === 'en_cours') return 1;
  return 0; // assignée / en_attente
};

const TimelineCourse = ({ statut }: { statut: string }) => {
  const actuel = indexEtape(statut);
  const annulee = statut === 'annulée';
  return (
    <div className="flex items-center gap-0 mb-3" aria-label={`Progression : ${ETAPES_COURSE[actuel].label}`}>
      {ETAPES_COURSE.map((etape, i) => {
        const faite = !annulee && i <= actuel;
        const active = !annulee && i === actuel;
        return (
          <div key={etape.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  annulee ? 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5'
                  : faite ? 'border-transparent text-white' : 'border-slate-200 dark:border-white/10 bg-transparent'
                }`}
                style={faite && !annulee ? { background: active ? 'var(--gradient-primary)' : '#22C55E', boxShadow: active ? 'var(--shadow-glow-primary)' : undefined } : undefined}
              >
                {faite && !annulee && <Check className="w-3 h-3" strokeWidth={3} />}
              </span>
              <span className={`text-[9px] font-semibold whitespace-nowrap ${active ? 'text-primary' : 'text-slate-400'}`}>{etape.label}</span>
            </div>
            {i < ETAPES_COURSE.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 rounded-full mb-4 transition-colors ${!annulee && i < actuel ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

type Onglet = 'apercu' | 'disponibles' | 'mes-livraisons' | 'parametres';

const MOYENS_TRANSPORT = ['moto', 'vélo', 'voiture', 'à pied'];

const MonProfilLivreur = () => {
  const [chargement, setChargement] = useState(true);
  const [livreur, setLivreur] = useState<Livreur | null>(null);
  const [erreur, setErreur] = useState('');
  const [onglet, setOnglet] = useState<Onglet>('apercu');

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

  // "Mes livraisons" est chargé dès que le profil livreur existe : l'aperçu
  // (livraisons du jour, revenus, performance) en a besoin immédiatement.
  useEffect(() => {
    if (!livreur) return;
    setMesLivraisonsErreur(false);
    API.get('/demandes-livraison/mes-livraisons')
      .then(({ data }) => setMesLivraisons(data))
      .catch(() => setMesLivraisonsErreur(true));
  }, [livreur]);

  useEffect(() => {
    if (!livreur || onglet !== 'disponibles') return;
    setDemandesChargement(true);
    setDemandesErreur(false);
    API.get('/demandes-livraison/disponibles')
      .then(({ data }) => setDemandes(data))
      .catch(() => setDemandesErreur(true))
      .finally(() => setDemandesChargement(false));
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

  const changerStatutLivraison = async (id: string, statut: 'en_cours' | 'en_route' | 'arrivée' | 'livrée') => {
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

  // ─── Statistiques dérivées des livraisons déjà chargées (aucun nouvel appel) ───
  const aujourdHui = new Date().toISOString().slice(0, 10);
  const livraisonsDuJour = useMemo(() => mesLivraisons.filter((d) => d.createdAt.slice(0, 10) === aujourdHui), [mesLivraisons, aujourdHui]);
  const livraisonsTerminees = useMemo(() => mesLivraisons.filter((d) => d.statut === 'livrée'), [mesLivraisons]);
  const revenus = useMemo(() => livraisonsTerminees.reduce((s, d) => s + (d.tarif || 0), 0), [livraisonsTerminees]);
  const tauxCompletion = useMemo(() => {
    const terminees = mesLivraisons.filter((d) => d.statut === 'livrée' || d.statut === 'annulée');
    if (terminees.length === 0) return 0;
    return Math.round((livraisonsTerminees.length / terminees.length) * 100);
  }, [mesLivraisons, livraisonsTerminees]);

  const zonesLivraison = useMemo(() => {
    const compte: Record<string, number> = {};
    mesLivraisons.forEach((d) => {
      const zone = d.adresseLivraison?.ville || d.adresseLivraison?.quartier;
      if (zone) compte[zone] = (compte[zone] || 0) + 1;
    });
    return Object.entries(compte).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [mesLivraisons]);

  if (chargement) return <div className="flex items-center justify-center min-h-[50vh]"><Spinner size="lg" /></div>;

  if (!livreur) {
    return (
      <div className="max-w-md mx-auto pb-24 animate-fade-in">
        <div className="text-center mb-6 animate-slide-up">
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #30D6C4 0%, #22C55E 100%)', boxShadow: '0 10px 30px -8px rgba(48,214,196,0.4)' }}>
            <Bike className="w-6 h-6 text-white" strokeWidth={2.1} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">Devenez livreur</h1>
          <p className="text-sm text-slate-500">Recevez des demandes de livraison près de chez vous.</p>
        </div>

        <form onSubmit={handleCreer} className="glass-solid rounded-[22px] p-5 space-y-4 animate-slide-up" style={{ animationDelay: '60ms' }}>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Moyen de transport</label>
            <div className="grid grid-cols-2 gap-2">
              {MOYENS_TRANSPORT.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCreationForm({ ...creationForm, moyenTransport: m })}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${creationForm.moyenTransport === m ? 'text-white shadow-md' : 'glass-light text-slate-600 hover:bg-white/60'}`}
                  style={creationForm.moyenTransport === m ? { background: 'var(--gradient-primary)' } : undefined}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Input
              label="Zones desservies"
              value={creationForm.zoneCouverture}
              onChange={(e) => setCreationForm({ ...creationForm, zoneCouverture: e.target.value })}
              placeholder="Ex : Cotonou, Akpakpa"
            />
            <p className="text-[11px] text-slate-400 mt-1">Séparez plusieurs zones par une virgule.</p>
          </div>
          <Input
            label="Tarif de base (XOF)"
            type="number"
            value={creationForm.tarifBase}
            onChange={(e) => setCreationForm({ ...creationForm, tarifBase: e.target.value })}
          />
          {creationErreur && <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{creationErreur}</p>}
          <Button type="submit" loading={creationEnCours} fullWidth icon={!creationEnCours ? <Check className="w-4 h-4" /> : undefined}>
            Devenir livreur
          </Button>
        </form>
      </div>
    );
  }

  const enLigne = livreur.disponibilite === 'en_ligne';

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      {/* ── Hero Delivery Center : identité + bascule de disponibilité ── */}
      <Card variant="glass-solid" className="mb-5 relative overflow-hidden animate-slide-up">
        <div className="absolute -top-14 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(48,214,196,0.16), transparent 70%)' }} aria-hidden="true" />
        <div className="relative flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${enLigne ? '' : 'bg-slate-100 dark:bg-white/10'}`} style={enLigne ? { background: 'linear-gradient(135deg, #30D6C4 0%, #22C55E 100%)' } : undefined}>
              <Bike className={`w-6 h-6 ${enLigne ? 'text-white' : 'text-slate-400'}`} strokeWidth={2.1} />
            </div>
            <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-[#23262d] ${enLigne ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/20'}`} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 capitalize flex items-center gap-2">
              Livreur · {livreur.moyenTransport}
            </p>
            <p className="text-xs text-slate-400 truncate">{livreur.zoneCouverture.join(', ') || 'Aucune zone renseignée'}</p>
          </div>
          <button
            onClick={toggleDisponibilite}
            disabled={toggleEnCours}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 disabled:opacity-60 flex-shrink-0 active:scale-95 ${enLigne ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' : 'glass-light text-slate-600'}`}
          >
            <Power className="w-3.5 h-3.5" /> {enLigne ? 'En ligne' : 'Hors ligne'}
          </button>
        </div>
      </Card>

      {erreur && <p className="text-xs text-red-500 mb-4 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{erreur}</p>}

      {/* ── Onglets en pilules verre ── */}
      <div className="flex gap-1.5 p-1.5 rounded-full glass-light mb-5 w-fit overflow-x-auto max-w-full">
        {([
          { id: 'apercu', label: 'Aperçu', icon: LayoutDashboard },
          { id: 'disponibles', label: 'Demandes', icon: Package },
          { id: 'mes-livraisons', label: 'Mes livraisons', icon: Truck },
          { id: 'parametres', label: 'Abonnement', icon: Crown },
        ] as const).map((o) => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap ${onglet === o.id ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            style={onglet === o.id ? { background: 'var(--gradient-primary)' } : undefined}
          >
            <o.icon className="w-3.5 h-3.5" /> {o.label}
          </button>
        ))}
      </div>

      {onglet === 'apercu' && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card variant="glass">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2"><Package className="w-4 h-4" strokeWidth={2.2} /></div>
              <p className="text-lg font-bold text-slate-900">{livraisonsDuJour.length}</p>
              <p className="text-xs text-slate-500">Livraisons aujourd'hui</p>
            </Card>
            <Card variant="glass">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2"><TrendingUp className="w-4 h-4" strokeWidth={2.2} /></div>
              <p className="text-lg font-bold text-slate-900">{revenus.toLocaleString('fr-FR')} <span className="text-xs font-medium text-slate-400">XOF</span></p>
              <p className="text-xs text-slate-500">Revenus (livrées)</p>
            </Card>
            <Card variant="glass">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-2"><Gauge className="w-4 h-4" strokeWidth={2.2} /></div>
              <p className="text-lg font-bold text-slate-900">{tauxCompletion}%</p>
              <p className="text-xs text-slate-500">Taux de réussite</p>
            </Card>
            <Card variant="glass">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-500 flex items-center justify-center mb-2"><Star className="w-4 h-4" strokeWidth={2.2} /></div>
              <p className="text-lg font-bold text-slate-900">{(livreur.nombreEvaluations || 0) > 0 ? livreur.noteMoyenne : '—'}</p>
              <p className="text-xs text-slate-500">Note moyenne ({livreur.nombreEvaluations || 0} avis)</p>
            </Card>
          </div>

          <Card variant="glass">
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="w-4 h-4 text-primary" strokeWidth={2.2} />
              <h3 className="text-sm font-bold text-slate-800">Historique récent</h3>
            </div>
            {mesLivraisonsErreur ? (
              <p className="text-xs text-red-500 py-4 text-center flex items-center justify-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />Impossible de charger vos livraisons.</p>
            ) : mesLivraisons.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Aucune livraison pour le moment.</p>
            ) : (
              <ul className="space-y-2.5">
                {mesLivraisons.slice(0, 5).map((d) => (
                  <li key={d._id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{d.sourceType === 'vente' ? 'Colis' : 'Repas'} · {d.adresseLivraison?.ville || d.adresseLivraison?.quartier || 'Non précisé'}</p>
                      <p className="text-xs text-slate-400">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <Badge tone={d.statut === 'livrée' ? 'success' : d.statut === 'annulée' ? 'danger' : 'neutral'} size="sm" className="capitalize flex-shrink-0">{d.statut.replace('_', ' ')}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {zonesLivraison.length > 0 && (
            <Card variant="glass">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" strokeWidth={2.2} />
                <h3 className="text-sm font-bold text-slate-800">Zones de livraison les plus fréquentes</h3>
              </div>
              <ul className="space-y-2">
                {zonesLivraison.map(([zone, nb]) => (
                  <li key={zone} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{zone}</span>
                    <Badge tone="primary" size="sm">{nb} livraison{nb > 1 ? 's' : ''}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {onglet === 'disponibles' && (
        <div className="space-y-3 animate-fade-in">
          {livreur.disponibilite !== 'en_ligne' && (
            <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-400/10 rounded-xl px-3 py-2.5 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />Passez en ligne pour recevoir des demandes.</p>
          )}
          {demandesChargement ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
          ) : demandesErreur ? (
            <p className="text-sm text-red-500 flex items-center gap-1.5 py-8 justify-center"><AlertCircle className="w-4 h-4" />Impossible de charger les demandes.</p>
          ) : demandes.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">Aucune demande de livraison disponible pour le moment.</p>
          ) : (
            demandes.map((d) => (
              <Card key={d._id} variant="glass" className="relative overflow-hidden">
                <div className="absolute -top-10 -right-8 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(48,214,196,0.12), transparent 70%)' }} aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="glass-pill text-[10px] font-bold uppercase tracking-wider text-emerald-600 rounded-full px-2.5 py-1">{d.sourceType === 'vente' ? 'Colis' : 'Repas'}</span>
                    {d.tarif > 0 && <span className="text-base font-bold text-primary">{d.tarif.toLocaleString('fr-FR')} XOF</span>}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-3"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Récupération : {d.adresseRecuperation?.ville || d.adresseRecuperation?.quartier || 'Non précisé'}</p>
                  <DestinationCard titre="Destination" adresse={d.adresseLivraison} />
                  <Button
                    onClick={() => accepterDemande(d._id)}
                    disabled={livreur.disponibilite !== 'en_ligne'}
                    loading={actionId === d._id}
                    fullWidth
                  >
                    Accepter cette livraison
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {onglet === 'mes-livraisons' && (
        <div className="space-y-3 animate-fade-in">
          {mesLivraisonsErreur ? (
            <p className="text-sm text-red-500 flex items-center gap-1.5 py-8 justify-center"><AlertCircle className="w-4 h-4" />Impossible de charger vos livraisons.</p>
          ) : mesLivraisons.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">Aucune livraison pour le moment.</p>
          ) : (
            mesLivraisons.map((d) => (
              <Card key={d._id} variant="glass">
                <div className="flex items-center justify-between mb-3">
                  <span className="glass-pill text-[10px] font-bold uppercase tracking-wider text-slate-500 rounded-full px-2.5 py-1">{d.sourceType === 'vente' ? 'Colis' : 'Repas'}</span>
                  {d.tarif > 0 && <span className="text-sm font-bold text-primary">{d.tarif.toLocaleString('fr-FR')} XOF</span>}
                </div>
                <TimelineCourse statut={d.statut} />
                <DestinationCard titre="Destination" adresse={d.adresseLivraison} />
                {d.statut === 'assignée' && (
                  <Button onClick={() => changerStatutLivraison(d._id, 'en_route')} loading={actionId === d._id} fullWidth>Démarrer la course</Button>
                )}
                {d.statut === 'en_cours' && (
                  <Button onClick={() => changerStatutLivraison(d._id, 'en_route')} loading={actionId === d._id} fullWidth>Je suis en route</Button>
                )}
                {d.statut === 'en_route' && (
                  <Button onClick={() => changerStatutLivraison(d._id, 'arrivée')} loading={actionId === d._id} fullWidth>Je suis arrivé</Button>
                )}
                {d.statut === 'arrivée' && (
                  <Button
                    onClick={() => changerStatutLivraison(d._id, 'livrée')}
                    loading={actionId === d._id}
                    fullWidth
                    className="!bg-emerald-500 hover:!bg-emerald-600"
                  >
                    Marquer comme livrée
                  </Button>
                )}
                {d.evaluation && (
                  <div className="mt-3 pt-3 border-t border-slate-900/[0.06] dark:border-white/10">
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`w-3.5 h-3.5 ${n <= d.evaluation!.note ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-white/20'}`} />
                      ))}
                      <span className="text-xs font-semibold text-slate-600 ml-1">{d.evaluation.note}/5</span>
                    </div>
                    {d.evaluation.commentaire && <p className="text-xs text-slate-500 italic">"{d.evaluation.commentaire}"</p>}
                  </div>
                )}
              </Card>
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
