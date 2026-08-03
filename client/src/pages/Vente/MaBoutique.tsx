import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Store, Plus, Minus, Pencil, Trash2, Package, ShoppingBag, AlertCircle,
  X as XIcon, Check, ExternalLink, Loader2, Bike, Crown
} from 'lucide-react';
import API from '../../api/axios';
import ImageUploader from '../../components/ImageUploader';
import AbonnementProWidget from '../../components/AbonnementProWidget/AbonnementProWidget';
import { CATEGORIES_PRODUIT, getCategorieProduitColor } from '../../utils/categoriesProduit';
import type { Boutique, Produit, Commande, DemandeLivraison, AbonnementPro } from '../../types';

const MAX_PHOTOS_PRODUIT = 10;

type Onglet = 'produits' | 'commandes' | 'parametres';

const STATUTS_COMMANDE: Commande['statut'][] = ['en_attente', 'confirmée', 'expédiée', 'livrée', 'annulée'];

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
  const [onglet, setOnglet] = useState<Onglet>('produits');

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

  useEffect(() => {
    if (onglet !== 'commandes' || !boutique) return;
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
  }, [onglet, boutique]);

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

  if (chargement) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-2 border-blue-200 border-t-[#007AFF] rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Aucune boutique : formulaire de création ───
  if (!boutique) {
    return (
      <div className="max-w-md mx-auto pb-24 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-3">
            <Store className="w-6 h-6 text-[#007AFF]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Créez votre boutique</h1>
          <p className="text-sm text-slate-500">Vendez vos produits près de chez vous, sans commission cachée.</p>
        </div>

        <form onSubmit={handleCreerBoutique} className="glass rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Nom de la boutique</label>
            <input
              value={creationForm.nom}
              onChange={(e) => setCreationForm({ ...creationForm, nom: e.target.value })}
              placeholder="Ex : Chez Fatima"
              className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Description</label>
            <textarea
              value={creationForm.description}
              onChange={(e) => setCreationForm({ ...creationForm, description: e.target.value })}
              placeholder="Que vendez-vous ?"
              rows={3}
              className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Ville</label>
            <input
              value={creationForm.ville}
              onChange={(e) => setCreationForm({ ...creationForm, ville: e.target.value })}
              placeholder="Ex : Cotonou"
              className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
            />
          </div>

          {creationErreur && (
            <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{creationErreur}</p>
          )}

          <button
            type="submit"
            disabled={creationEnCours}
            className="w-full py-3.5 bg-[#007AFF] text-white rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {creationEnCours && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer ma boutique
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
      {/* En-tête boutique */}
      <div className="glass rounded-2xl p-5 mb-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {boutique.logo ? <img src={boutique.logo} alt={boutique.nom} className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-slate-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-slate-900 truncate">{boutique.nom}</h1>
          <p className="text-xs text-slate-400">{produits.length} produit{produits.length > 1 ? 's' : ''}</p>
        </div>
        <Link
          to={`/boutique/${boutique._id}`}
          target="_blank"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#007AFF] hover:underline flex-shrink-0"
        >
          Voir la vitrine <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {erreur && (
        <p className="text-xs text-red-500 mb-4 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{erreur}</p>
      )}

      {/* Onglets */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 mb-5 w-fit">
        {([
          { id: 'produits', label: 'Produits', icon: Package },
          { id: 'commandes', label: 'Commandes', icon: ShoppingBag },
          { id: 'parametres', label: 'Abonnement', icon: Crown },
        ] as const).map((o) => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
              onglet === o.id ? 'bg-white text-[#007AFF] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <o.icon className="w-4 h-4" /> {o.label}
          </button>
        ))}
      </div>

      {onglet === 'produits' && (
        <div>
          <button
            onClick={ouvrirCreationProduit}
            className="w-full mb-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:border-[#007AFF] hover:text-[#007AFF] transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Ajouter un produit
          </button>

          {produits.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">Aucun produit pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {produits.map((p) => (
                <div key={p._id} className="glass rounded-2xl p-3 flex gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {p.photos?.[0] ? <img src={p.photos[0]} alt={p.nom} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{p.nom}</p>
                    <p className="text-xs font-medium mb-1" style={{ color: getCategorieProduitColor(p.categorie) }}>{p.categorie}</p>
                    <p className="text-sm font-bold text-slate-900">{p.prix.toLocaleString('fr-FR')} XOF</p>
                    <p className={`text-[11px] ${p.quantiteDisponible === 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {p.quantiteDisponible === 0 ? 'Rupture de stock' : `${p.quantiteDisponible} en stock`}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => ouvrirEditionProduit(p)} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Modifier">
                      <Pencil className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <button
                      onClick={() => handleSupprimerProduit(p._id)}
                      disabled={suppressionId === p._id}
                      className="p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
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
                  <p className="text-sm font-semibold text-slate-900">
                    {typeof c.client === 'object' ? `${c.client.prenom} ${c.client.nom}` : 'Client'}
                  </p>
                  <p className="text-sm font-bold text-slate-900">{c.montantTotal.toLocaleString('fr-FR')} XOF</p>
                </div>
                <ul className="text-xs text-slate-500 mb-3 space-y-0.5">
                  {c.articles.map((a, i) => (
                    <li key={i}>{a.quantite} × {a.nom}{a.varianteChoisie ? ` (${a.varianteChoisie})` : ''}</li>
                  ))}
                </ul>
                <select
                  value={c.statut}
                  onChange={(e) => handleChangerStatutCommande(c._id, e.target.value as Commande['statut'])}
                  disabled={majStatutId === c._id}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 outline-none disabled:opacity-50"
                >
                  {STATUTS_COMMANDE.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>

                {c.livraisonDemandee && (
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

      {onglet === 'parametres' && boutique && (
        <AbonnementProWidget
          espaceType="vente"
          espaceId={boutique._id}
          abonnementPro={boutique.abonnementPro}
          onUpdated={(abonnementPro: AbonnementPro) => setBoutique((b) => b && { ...b, abonnementPro })}
        />
      )}

      {/* Modale produit (création / édition) */}
      {produitModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => setProduitModal(null)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] overflow-y-auto glass rounded-3xl shadow-2xl p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">{produitModal.mode === 'creation' ? 'Nouveau produit' : 'Modifier le produit'}</h2>
              <button onClick={() => setProduitModal(null)} className="p-1.5 rounded-full hover:bg-slate-100">
                <XIcon className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Photos <span className="text-slate-400 normal-case font-normal">({produitModal.produit.photos.filter(Boolean).length}/{MAX_PHOTOS_PRODUIT})</span>
                  </p>
                  {produitModal.produit.photos.length < MAX_PHOTOS_PRODUIT && (
                    <button
                      type="button"
                      onClick={() => setProduitModal((m) => m && { ...m, produit: { ...m.produit, photos: [...m.produit.photos, ''] } })}
                      className="flex items-center gap-1 text-xs font-medium text-[#007AFF] hover:text-blue-700 transition-colors px-2.5 py-1 rounded-lg hover:bg-blue-50"
                    >
                      <Plus className="w-3.5 h-3.5" /> Ajouter
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(produitModal.produit.photos.length > 0 ? produitModal.produit.photos : ['']).map((url, idx) => (
                    <div
                      key={idx}
                      className={`relative group rounded-xl border-2 border-dashed overflow-hidden aspect-square ${
                        url ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white/50 hover:border-[#007AFF] hover:bg-blue-50/30'
                      }`}
                    >
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
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-[#007AFF] text-white text-[9px] font-bold rounded-full pointer-events-none">COUVERTURE</div>
                      )}
                      {produitModal.produit.photos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setProduitModal((m) => m && { ...m, produit: { ...m.produit, photos: m.produit.photos.filter((_, i) => i !== idx) } })}
                          className="glass-control absolute top-1.5 right-1.5 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          aria-label="Supprimer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <input
                value={produitModal.produit.nom}
                onChange={(e) => setProduitModal((m) => m && { ...m, produit: { ...m.produit, nom: e.target.value } })}
                placeholder="Nom du produit"
                className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
              <textarea
                value={produitModal.produit.description}
                onChange={(e) => setProduitModal((m) => m && { ...m, produit: { ...m.produit, description: e.target.value } })}
                placeholder="Description"
                rows={3}
                className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />

              <select
                value={produitModal.produit.categorie}
                onChange={(e) => setProduitModal((m) => m && { ...m, produit: { ...m.produit, categorie: e.target.value } })}
                className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Choisir une catégorie</option>
                {CATEGORIES_PRODUIT.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={produitModal.produit.prix}
                  onChange={(e) => setProduitModal((m) => m && { ...m, produit: { ...m.produit, prix: e.target.value } })}
                  placeholder="Prix (XOF)"
                  className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="number"
                  value={produitModal.produit.quantiteDisponible}
                  onChange={(e) => setProduitModal((m) => m && { ...m, produit: { ...m.produit, quantiteDisponible: e.target.value } })}
                  placeholder="Stock"
                  className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  value={produitModal.produit.marque}
                  onChange={(e) => setProduitModal((m) => m && { ...m, produit: { ...m.produit, marque: e.target.value } })}
                  placeholder="Marque (optionnel)"
                  className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
                <select
                  value={produitModal.produit.etat}
                  onChange={(e) => setProduitModal((m) => m && { ...m, produit: { ...m.produit, etat: e.target.value as 'neuf' | 'occasion' } })}
                  className="w-full px-4 py-3 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="neuf">Neuf</option>
                  <option value="occasion">Occasion</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={produitModal.produit.livraisonPossible}
                  onChange={(e) => setProduitModal((m) => m && { ...m, produit: { ...m.produit, livraisonPossible: e.target.checked } })}
                  className="w-4 h-4 rounded accent-[#007AFF]"
                />
                Livraison possible
              </label>

              {produitModal.mode === 'edition' && (
                <label className={`flex items-center gap-2 text-sm ${boutique?.abonnementPro?.actif ? 'text-slate-600' : 'text-slate-300'}`}>
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

              <button
                onClick={handleSauverProduit}
                disabled={produitEnvoi}
                className="w-full py-3.5 bg-[#007AFF] text-white rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {produitEnvoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {produitModal.mode === 'creation' ? 'Ajouter le produit' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaBoutique;
