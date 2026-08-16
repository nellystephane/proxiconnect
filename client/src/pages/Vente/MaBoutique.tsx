import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Store, Plus, Minus, Pencil, Trash2, Package, ShoppingBag, AlertCircle,
  Check, ExternalLink, Bike, Crown, LayoutDashboard, TrendingUp, Boxes,
  BarChart3, Sparkles,
} from 'lucide-react';
import API from '../../api/axios';
import { Spinner, Modal, Card, Button, Input, Textarea, Select, Badge, EmptyState } from '../../components/ui';
import type { BadgeTone } from '../../components/ui';
import ImageUploader from '../../components/ImageUploader';
import AbonnementProWidget from '../../components/AbonnementProWidget/AbonnementProWidget';
import { CATEGORIES_PRODUIT, getCategorieProduitColor } from '../../utils/categoriesProduit';
import type { Boutique, Produit, Commande, DemandeLivraison, AbonnementPro } from '../../types';

const MAX_PHOTOS_PRODUIT = 10;

type Onglet = 'apercu' | 'produits' | 'commandes' | 'parametres';

const STATUTS_COMMANDE: Commande['statut'][] = ['en_attente', 'confirmée', 'expédiée', 'livrée', 'annulée'];

// ─── Ton du badge de statut : en_attente=amber, en cours=bleu,
// expédiée/livrée=emerald, annulée=red (tons du design system) ───
const toneStatutCommande = (statut: Commande['statut']): BadgeTone =>
  statut === 'annulée' ? 'danger'
  : statut === 'en_attente' ? 'warning'
  : statut === 'expédiée' || statut === 'livrée' ? 'success'
  : 'primary';

const produitVide = {
  nom: '', description: '', categorie: '', prix: '', quantiteDisponible: '',
  etat: 'neuf' as 'neuf' | 'occasion', marque: '', modele: '', livraisonPossible: true,
  photos: [] as string[], estMisEnAvant: false,
};

const MaBoutique = () => {
  const [chargement, setChargement] = useState(true);
  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [erreur, setErreur] = useState('');
  const [onglet, setOnglet] = useState<Onglet>('apercu');

  // ─── Création de boutique ───
  const [creationForm, setCreationForm] = useState({ nom: '', description: '', ville: '' });
  const [creationEnCours, setCreationEnCours] = useState(false);
  const [creationErreur, setCreationErreur] = useState('');

  // ─── Modale produit (création / édition) ───
  const [produitModal, setProduitModal] = useState<{ mode: 'creation' | 'edition'; produit: typeof produitVide; id?: string } | null>(null);
  const [produitEnvoi, setProduitEnvoi] = useState(false);
  const [produitErreur, setProduitErreur] = useState('');
  const [suppressionId, setSuppressionId] = useState<string | null>(null);

  // ─── Commandes reçues ───
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [commandesErreur, setCommandesErreur] = useState(false);
  const [majStatutId, setMajStatutId] = useState<string | null>(null);

  // ─── Demandes de livraison liées aux commandes ───
  const [demandesLivraison, setDemandesLivraison] = useState<Record<string, DemandeLivraison>>({});
  const [demandeEnCoursId, setDemandeEnCoursId] = useState<string | null>(null);

  const chargerBoutique = useCallback(() => {
    setChargement(true);
    setErreur('');
    API.get('/boutiques/moi')
      .then(({ data }) => {
        setBoutique(data.boutique);
        setProduits(data.produits);
      })
      .catch((err) => {
        if (err.response?.status !== 404) setErreur("Impossible de charger votre boutique pour le moment.");
      })
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => { chargerBoutique(); }, [chargerBoutique]);

  // Chargées dès que la boutique existe (et pas seulement à l'ouverture de l'onglet
  // "Commandes") : l'aperçu a besoin de ces données pour son chiffre d'affaires,
  // ses ventes et son graphique.
  useEffect(() => {
    if (!boutique) return;
    setCommandesErreur(false);
    API.get('/commandes/recues')
      .then(({ data }) => setCommandes(data))
      .catch(() => setCommandesErreur(true));
    API.get('/demandes-livraison/mes-demandes')
      .then(({ data }) => {
        const parSource: Record<string, DemandeLivraison> = {};
        (data as DemandeLivraison[]).forEach((d) => { if (d.sourceType === 'vente') parSource[d.sourceId] = d; });
        setDemandesLivraison(parSource);
      })
      .catch(() => {});
  }, [boutique]);

  const handleCreerBoutique = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creationForm.nom.trim()) {
      setCreationErreur('Le nom de votre boutique est obligatoire.');
      return;
    }
    setCreationEnCours(true);
    setCreationErreur('');
    try {
      const { data } = await API.post('/boutiques', {
        nom: creationForm.nom,
        description: creationForm.description,
        localisation: { ville: creationForm.ville },
      });
      setBoutique(data);
    } catch (err: any) {
      setCreationErreur(err.response?.data?.message || 'Erreur lors de la création de la boutique.');
    } finally {
      setCreationEnCours(false);
    }
  };

  const ouvrirCreationProduit = () => {
    setProduitErreur('');
    setProduitModal({ mode: 'creation', produit: { ...produitVide } });
    setOnglet('produits');
  };

  const ouvrirEditionProduit = (p: Produit) => {
    setProduitErreur('');
    setProduitModal({
      mode: 'edition',
      id: p._id,
      produit: {
        nom: p.nom, description: p.description, categorie: p.categorie,
        prix: String(p.prix), quantiteDisponible: String(p.quantiteDisponible),
        etat: p.etat, marque: p.marque, modele: p.modele,
        livraisonPossible: p.livraisonPossible, photos: p.photos || [],
        estMisEnAvant: p.estMisEnAvant,
      },
    });
  };

  const handleSauverProduit = async () => {
    if (!produitModal) return;
    const { nom, description, categorie, prix } = produitModal.produit;
    if (!nom.trim() || !description.trim() || !categorie || !prix) {
      setProduitErreur('Nom, description, catégorie et prix sont obligatoires.');
      return;
    }
    setProduitEnvoi(true);
    setProduitErreur('');
    const payload = {
      ...produitModal.produit,
      prix: Number(produitModal.produit.prix),
      quantiteDisponible: Number(produitModal.produit.quantiteDisponible) || 0,
      photos: produitModal.produit.photos.filter((url) => url && url.trim() !== ''),
    };
    try {
      if (produitModal.mode === 'creation') {
        const { data } = await API.post('/produits', payload);
        setProduits((prev) => [data, ...prev]);
      } else {
        const { data } = await API.put(`/produits/${produitModal.id}`, payload);
        setProduits((prev) => prev.map((p) => (p._id === data._id ? data : p)));
      }
      setProduitModal(null);
    } catch (err: any) {
      setProduitErreur(err.response?.data?.message || "Erreur lors de l'enregistrement du produit.");
    } finally {
      setProduitEnvoi(false);
    }
  };

  const handleSupprimerProduit = async (id: string) => {
    setSuppressionId(id);
    try {
      await API.delete(`/produits/${id}`);
      setProduits((prev) => prev.filter((p) => p._id !== id));
    } catch {
      setErreur("Impossible de supprimer ce produit. Réessayez.");
    } finally {
      setSuppressionId(null);
    }
  };

  const handleChangerStatutCommande = async (commandeId: string, statut: Commande['statut']) => {
    setMajStatutId(commandeId);
    try {
      const { data } = await API.put(`/commandes/${commandeId}/statut`, { statut });
      setCommandes((prev) => prev.map((c) => (c._id === data._id ? data : c)));
    } catch {
      setCommandesErreur(true);
    } finally {
      setMajStatutId(null);
    }
  };

  const handleDemanderLivreur = async (commandeId: string) => {
    if (!boutique) return;
    setDemandeEnCoursId(commandeId);
    try {
      const { data } = await API.post('/demandes-livraison', {
        sourceType: 'vente',
        sourceId: commandeId,
        adresseRecuperation: boutique.localisation,
      });
      setDemandesLivraison((prev) => ({ ...prev, [commandeId]: data }));
    } catch (err: any) {
      setErreur(err.response?.data?.message || "Impossible de demander un livreur pour cette commande.");
    } finally {
      setDemandeEnCoursId(null);
    }
  };

  // ─── Statistiques dérivées des données déjà chargées (aucun nouvel appel API) ───
  const commandesValides = useMemo(() => commandes.filter((c) => c.statut !== 'annulée'), [commandes]);
  const chiffreAffaires = useMemo(() => commandesValides.reduce((s, c) => s + c.montantTotal, 0), [commandesValides]);

  const ventesParJour = useMemo(() => {
    const jours: { label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const cle = d.toISOString().slice(0, 10);
      const total = commandesValides
        .filter((c) => c.createdAt.slice(0, 10) === cle)
        .reduce((s, c) => s + c.montantTotal, 0);
      jours.push({ label: d.toLocaleDateString('fr-FR', { weekday: 'short' }), total });
    }
    return jours;
  }, [commandesValides]);
  const maxVenteJour = Math.max(1, ...ventesParJour.map((j) => j.total));

  const produitsPopulaires = useMemo(() => {
    const compte: Record<string, { nom: string; quantite: number }> = {};
    commandesValides.forEach((c) => {
      c.articles.forEach((a) => {
        const cle = a.produit || a.nom;
        if (!compte[cle]) compte[cle] = { nom: a.nom, quantite: 0 };
        compte[cle].quantite += a.quantite;
      });
    });
    return Object.values(compte).sort((a, b) => b.quantite - a.quantite).slice(0, 5);
  }, [commandesValides]);

  const stock = useMemo(() => {
    const rupture = produits.filter((p) => p.quantiteDisponible === 0).length;
    const faible = produits.filter((p) => p.quantiteDisponible > 0 && p.quantiteDisponible <= 5).length;
    return { rupture, faible, ok: produits.length - rupture - faible };
  }, [produits]);

  if (chargement) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  // ─── Aucune boutique : formulaire de création ───
  if (!boutique) {
    return (
      <div className="max-w-md mx-auto pb-24 animate-fade-in">
        <div className="text-center mb-6 animate-slide-up">
          {/* Tuile d'identité Vente : dégradé bleu → indigo de l'espace */}
          <div
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'var(--gradient-primary)', boxShadow: '0 10px 30px -8px rgba(10, 132, 255, 0.4)' }}
          >
            <Store className="w-6 h-6 text-white" strokeWidth={2.1} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">Créez votre boutique</h1>
          <p className="text-sm text-slate-500">Vendez vos produits près de chez vous, sans commission cachée.</p>
        </div>

        <form onSubmit={handleCreerBoutique} className="glass-solid rounded-[22px] p-5 space-y-4 animate-slide-up" style={{ animationDelay: '60ms' }}>
          <Input
            label="Nom de la boutique"
            value={creationForm.nom}
            onChange={(e) => setCreationForm({ ...creationForm, nom: e.target.value })}
            placeholder="Ex : Chez Fatima"
          />
          <Textarea
            label="Description"
            value={creationForm.description}
            onChange={(e) => setCreationForm({ ...creationForm, description: e.target.value })}
            placeholder="Que vendez-vous ?"
            rows={3}
          />
          <Input
            label="Ville"
            value={creationForm.ville}
            onChange={(e) => setCreationForm({ ...creationForm, ville: e.target.value })}
            placeholder="Ex : Cotonou"
          />

          {creationErreur && (
            <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{creationErreur}</p>
          )}

          <Button type="submit" loading={creationEnCours} fullWidth size="lg">
            Créer ma boutique
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      {/* ── Cockpit : identité de la boutique, statut, CTA principal ── */}
      <div className="glass-elevated rounded-3xl p-5 mb-5 relative overflow-hidden animate-slide-up">
        {/* Halo teinté à la couleur de l'espace Vente (bleu → indigo) */}
        <div className="absolute -top-14 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(10, 132, 255, 0.16), transparent 70%)' }} aria-hidden="true" />
        <div className="absolute -bottom-16 -left-12 w-44 h-44 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(94, 92, 230, 0.12), transparent 70%)' }} aria-hidden="true" />

        <div className="relative flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.14), rgba(94, 92, 230, 0.14))', boxShadow: 'var(--glass-specular)' }}
          >
            {boutique.logo ? <img src={boutique.logo} alt={boutique.nom} className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-primary" strokeWidth={2.1} />}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 truncate">{boutique.nom}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-xs text-slate-400">{produits.length} produit{produits.length > 1 ? 's' : ''} · {boutique.localisation?.ville || 'Ville'}</p>
              {boutique.abonnementPro?.actif && (
                <Badge tone="warning" size="sm"><Crown className="w-3 h-3" /> Pro</Badge>
              )}
            </div>
          </div>
          {/* CTA principal : nouvelle mise en vente (icône seule sur mobile) */}
          <Button onClick={ouvrirCreationProduit} size="sm" className="flex-shrink-0 !px-3 sm:!px-4" aria-label="Nouveau produit">
            <Plus className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">Nouveau produit</span>
          </Button>
        </div>

        <Link
          to={`/boutique/${boutique._id}`}
          target="_blank"
          className="glass-pill relative inline-flex items-center gap-1.5 text-xs font-semibold text-primary rounded-full px-3.5 py-1.5 mt-3.5 no-underline hover:-translate-y-0.5 transition-transform animate-fade-in"
        >
          Voir la vitrine <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {erreur && (
        <p className="text-xs text-red-500 mb-4 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{erreur}</p>
      )}

      {/* ── Onglets en pilules verre — actif : dégradé bleu → indigo ── */}
      <div className="flex gap-1.5 p-1.5 rounded-full glass-light mb-5 w-fit overflow-x-auto max-w-full animate-fade-in">
        {([
          { id: 'apercu', label: 'Aperçu', icon: LayoutDashboard },
          { id: 'produits', label: 'Produits', icon: Package },
          { id: 'commandes', label: 'Commandes', icon: ShoppingBag },
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
          {/* Cartes de stats : pastille icône + valeur */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card variant="glass">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2"><TrendingUp className="w-4 h-4" strokeWidth={2.2} /></div>
              <p className="text-lg font-bold text-slate-900">{chiffreAffaires.toLocaleString('fr-FR')} <span className="text-xs font-medium text-slate-400">XOF</span></p>
              <p className="text-xs text-slate-500">Chiffre d'affaires</p>
            </Card>
            <Card variant="glass">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2"><ShoppingBag className="w-4 h-4" strokeWidth={2.2} /></div>
              <p className="text-lg font-bold text-slate-900">{commandesValides.length}</p>
              <p className="text-xs text-slate-500">Ventes</p>
            </Card>
            <Card variant="glass">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-500 flex items-center justify-center mb-2"><Boxes className="w-4 h-4" strokeWidth={2.2} /></div>
              <p className="text-lg font-bold text-slate-900">{produits.length}</p>
              <p className="text-xs text-slate-500">Produits</p>
            </Card>
            <Card variant="glass">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mb-2"><AlertCircle className="w-4 h-4" strokeWidth={2.2} /></div>
              <p className="text-lg font-bold text-slate-900">{stock.rupture}</p>
              <p className="text-xs text-slate-500">En rupture</p>
            </Card>
          </div>

          {/* Graphique des ventes (7 derniers jours) — barres dégradé Vente */}
          <Card variant="glass">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" strokeWidth={2.2} />
              <h3 className="text-sm font-bold text-slate-800">Ventes des 7 derniers jours</h3>
            </div>
            <div className="flex items-end justify-between gap-2 h-32">
              {ventesParJour.map((j, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-xl transition-all duration-500"
                      style={{ height: `${Math.max(4, (j.total / maxVenteJour) * 100)}%`, background: 'var(--gradient-primary)' }}
                      title={`${j.total.toLocaleString('fr-FR')} XOF`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 capitalize">{j.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Produits populaires */}
            <Card variant="glass">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" strokeWidth={2.2} />
                <h3 className="text-sm font-bold text-slate-800">Produits populaires</h3>
              </div>
              {produitsPopulaires.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Pas encore de ventes.</p>
              ) : (
                <ul className="space-y-2">
                  {produitsPopulaires.map((p, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-slate-700 truncate"><span className="text-slate-400 font-semibold mr-1">{i + 1}.</span>{p.nom}</span>
                      <Badge tone="primary" size="sm" className="flex-shrink-0">{p.quantite} vendu{p.quantite > 1 ? 's' : ''}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* État du stock */}
            <Card variant="glass">
              <div className="flex items-center gap-2 mb-3">
                <Boxes className="w-4 h-4 text-primary" strokeWidth={2.2} />
                <h3 className="text-sm font-bold text-slate-800">État du stock</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-slate-600">En stock</span><Badge tone="success" size="sm">{stock.ok}</Badge></div>
                <div className="flex items-center justify-between"><span className="text-slate-600">Stock faible (≤5)</span><Badge tone="warning" size="sm">{stock.faible}</Badge></div>
                <div className="flex items-center justify-between"><span className="text-slate-600">Rupture</span><Badge tone="danger" size="sm">{stock.rupture}</Badge></div>
              </div>
            </Card>
          </div>

          <Button onClick={ouvrirCreationProduit} fullWidth size="lg" icon={<Plus className="w-4 h-4" />}>
            Ajouter un produit
          </Button>
        </div>
      )}

      {onglet === 'produits' && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Mes produits</h2>
              <p className="text-xs text-slate-400">{produits.length} produit{produits.length > 1 ? 's' : ''} en ligne</p>
            </div>
            <Button onClick={ouvrirCreationProduit} size="sm" className="flex-shrink-0" icon={<Plus className="w-4 h-4" />}>
              <span className="hidden sm:inline">Ajouter un produit</span>
              <span className="sm:hidden">Ajouter</span>
            </Button>
          </div>

          {produits.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Aucun produit pour le moment"
              description="Ajoutez votre premier produit pour commencer à vendre."
              action={<Button onClick={ouvrirCreationProduit} size="sm" icon={<Plus className="w-4 h-4" />}>Ajouter un produit</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {produits.map((p) => (
                <Card key={p._id} variant="glass" padding="none" className="overflow-hidden animate-fade-in">
                  {/* Visuel image-first (4:3) + actions rondes verre */}
                  <div className="relative aspect-[4/3] bg-slate-100 dark:bg-white/5">
                    {p.photos?.[0] ? (
                      <img src={p.photos[0]} alt={p.nom} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center"><Package className="w-8 h-8 text-slate-300" /></div>
                    )}
                    {p.estMisEnAvant && (
                      <div className="absolute top-2 left-2">
                        <Badge tone="warning" size="sm"><Sparkles className="w-3 h-3" /> Mis en avant</Badge>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                      <button
                        onClick={() => ouvrirEditionProduit(p)}
                        className="glass-control w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                        aria-label="Modifier"
                        title="Modifier"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleSupprimerProduit(p._id)}
                        disabled={suppressionId === p._id}
                        className="glass-control w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-red-500 disabled:opacity-50 transition-colors"
                        aria-label="Supprimer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-slate-900 truncate">{p.nom}</p>
                    <p className="text-[11px] font-medium" style={{ color: getCategorieProduitColor(p.categorie) }}>{p.categorie}</p>
                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <p className="text-sm font-bold text-primary">{p.prix.toLocaleString('fr-FR')} XOF</p>
                      <Badge tone={p.quantiteDisponible === 0 ? 'danger' : p.quantiteDisponible <= 5 ? 'warning' : 'success'} size="sm" className="flex-shrink-0">
                        {p.quantiteDisponible === 0 ? 'Rupture de stock' : `${p.quantiteDisponible} en stock`}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {onglet === 'commandes' && (
        <div className="space-y-3 animate-fade-in">
          {commandesErreur ? (
            <p className="text-sm text-red-500 flex items-center gap-1.5 py-8 justify-center"><AlertCircle className="w-4 h-4" />Impossible de charger vos commandes.</p>
          ) : commandes.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Aucune commande reçue"
              description="Vos futures commandes clients apparaîtront ici."
            />
          ) : (
            commandes.map((c) => (
              <Card key={c._id} variant="glass" className="animate-fade-in">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {typeof c.client === 'object' ? `${c.client.prenom} ${c.client.nom}` : 'Client'}
                    </p>
                    <p className="text-[11px] text-slate-400">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 flex-shrink-0">{c.montantTotal.toLocaleString('fr-FR')} XOF</p>
                </div>
                <ul className="text-xs text-slate-500 mb-3 space-y-0.5">
                  {c.articles.map((a, i) => (
                    <li key={i}>{a.quantite} × {a.nom}{a.varianteChoisie ? ` (${a.varianteChoisie})` : ''}</li>
                  ))}
                </ul>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Badge tone={toneStatutCommande(c.statut)} size="md" className="capitalize">{c.statut.replace('_', ' ')}</Badge>
                  <Select
                    value={c.statut}
                    onChange={(e) => handleChangerStatutCommande(c._id, e.target.value as Commande['statut'])}
                    disabled={majStatutId === c._id}
                    className="!py-1.5 !text-xs w-fit"
                  >
                    {STATUTS_COMMANDE.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </Select>
                </div>

                {c.livraisonDemandee && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-white/5">
                    {demandesLivraison[c._id] ? (
                      <Badge tone="primary" size="md" className="!py-1.5">
                        <Bike className="w-3.5 h-3.5" /> Livreur : {demandesLivraison[c._id].statut.replace('_', ' ')}
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => handleDemanderLivreur(c._id)}
                        loading={demandeEnCoursId === c._id}
                        variant="ghost"
                        size="sm"
                        icon={<Bike className="w-3.5 h-3.5" />}
                      >
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

      {onglet === 'parametres' && boutique && (
        <AbonnementProWidget
          espaceType="vente"
          espaceId={boutique._id}
          abonnementPro={boutique.abonnementPro}
          onUpdated={(abonnementPro: AbonnementPro) => setBoutique((b) => b && { ...b, abonnementPro })}
        />
      )}

      {/* Modale produit (création / édition) — panneau glass-modal */}
      {produitModal && (
        <Modal
          open
          onClose={() => setProduitModal(null)}
          title={produitModal.mode === 'creation' ? 'Nouveau produit' : 'Modifier le produit'}
        >
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  Photos <span className="text-slate-400 normal-case font-normal">({produitModal.produit.photos.filter(Boolean).length}/{MAX_PHOTOS_PRODUIT})</span>
                </p>
                {produitModal.produit.photos.length < MAX_PHOTOS_PRODUIT && (
                  <button
                    type="button"
                    onClick={() => setProduitModal((m) => m && { ...m, produit: { ...m.produit, photos: [...m.produit.photos, ''] } })}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors px-2.5 py-1 rounded-lg hover:bg-primary/10"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </button>
                )}
              </div>

              {/* Grille de vignettes : le slot vide est dessiné par ImageUploader */}
              <div className="grid grid-cols-3 gap-2">
                {(produitModal.produit.photos.length > 0 ? produitModal.produit.photos : ['']).map((url, idx) => (
                  <div key={idx} className="relative group rounded-2xl overflow-hidden aspect-square">
                    <ImageUploader
                      currentImage={url}
                      onUpload={(nouvelleUrl) => setProduitModal((m) => {
                        if (!m) return m;
                        const photos = [...m.produit.photos];
                        if (photos.length === 0) photos.push(nouvelleUrl); else photos[idx] = nouvelleUrl;
                        return { ...m, produit: { ...m.produit, photos } };
                      })}
                    />
                    {idx === 0 && url && (
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-primary text-white text-[9px] font-bold rounded-full pointer-events-none">COUVERTURE</div>
                    )}
                    {produitModal.produit.photos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setProduitModal((m) => m && { ...m, produit: { ...m.produit, photos: m.produit.photos.filter((_, i) => i !== idx) } })}
                        className="glass-control absolute top-1.5 right-1.5 p-1 text-slate-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Supprimer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Input
              label="Nom"
              value={produitModal.produit.nom}
              onChange={(e) => setProduitModal((m) => m && { ...m, produit: { ...m.produit, nom: e.target.value } })}
              placeholder="Nom du produit"
            />
            <Textarea
              label="Description"
              value={produitModal.produit.description}
              onChange={(e) => setProduitModal((m) => m && { ...m, produit: { ...m.produit, description: e.target.value } })}
              placeholder="Description"
              rows={3}
            />

            <Select
              label="Catégorie"
              value={produitModal.produit.categorie}
              onChange={(e) => setProduitModal((m) => m && { ...m, produit: { ...m.produit, categorie: e.target.value } })}
            >
              <option value="">Choisir une catégorie</option>
              {CATEGORIES_PRODUIT.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Prix (XOF)"
                type="number"
                value={produitModal.produit.prix}
                onChange={(e) => setProduitModal((m) => m && { ...m, produit: { ...m.produit, prix: e.target.value } })}
                placeholder="Prix (XOF)"
              />
              <Input
                label="Stock"
                type="number"
                value={produitModal.produit.quantiteDisponible}
                onChange={(e) => setProduitModal((m) => m && { ...m, produit: { ...m.produit, quantiteDisponible: e.target.value } })}
                placeholder="Stock"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Marque (optionnel)"
                value={produitModal.produit.marque}
                onChange={(e) => setProduitModal((m) => m && { ...m, produit: { ...m.produit, marque: e.target.value } })}
                placeholder="Marque (optionnel)"
              />
              <Select
                label="État"
                value={produitModal.produit.etat}
                onChange={(e) => setProduitModal((m) => m && { ...m, produit: { ...m.produit, etat: e.target.value as 'neuf' | 'occasion' } })}
              >
                <option value="neuf">Neuf</option>
                <option value="occasion">Occasion</option>
              </Select>
            </div>

            <label className="flex items-center gap-2.5 text-sm text-slate-600 glass-light rounded-xl px-3.5 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={produitModal.produit.livraisonPossible}
                onChange={(e) => setProduitModal((m) => m && { ...m, produit: { ...m.produit, livraisonPossible: e.target.checked } })}
                className="w-4 h-4 rounded accent-primary"
              />
              Livraison possible
            </label>

            {produitModal.mode === 'edition' && (
              <label className={`flex items-center gap-2.5 text-sm glass-light rounded-xl px-3.5 py-2.5 cursor-pointer ${boutique?.abonnementPro?.actif ? 'text-slate-600' : 'text-slate-400'}`}>
                <input
                  type="checkbox"
                  checked={produitModal.produit.estMisEnAvant}
                  disabled={!boutique?.abonnementPro?.actif}
                  onChange={(e) => setProduitModal((m) => m && { ...m, produit: { ...m.produit, estMisEnAvant: e.target.checked } })}
                  className="w-4 h-4 rounded accent-amber-500 disabled:opacity-40"
                />
                Mettre en avant {!boutique?.abonnementPro?.actif && <span className="text-xs text-amber-500 ml-1">(nécessite l'abonnement Pro)</span>}
              </label>
            )}

            {produitErreur && (
              <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{produitErreur}</p>
            )}

            <Button onClick={handleSauverProduit} loading={produitEnvoi} fullWidth icon={<Check className="w-4 h-4" />}>
              {produitModal.mode === 'creation' ? 'Ajouter le produit' : 'Enregistrer'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MaBoutique;
