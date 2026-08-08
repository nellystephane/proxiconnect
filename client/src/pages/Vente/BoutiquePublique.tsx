import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Store, MapPin, Package, ShoppingCart, Plus, Minus,
  AlertCircle, Loader2, Check, ArrowLeft, MessageCircle
} from 'lucide-react';
import API from '../../api/axios';
import { Spinner, EmptyState, Modal, Button } from '../../components/ui';
import DestinationLivraison from '../../components/DestinationLivraison/DestinationLivraison';
import { useAuth } from '../../context/AuthContext';
import { useContacter } from '../../hooks/useContacter';
import { getCategorieProduitColor } from '../../utils/categoriesProduit';
import type { Boutique, Produit, DestinationLivraison as DestinationLivraisonValue } from '../../types';

interface LigneCommande {
  produit: Produit;
  quantite: number;
}

const BoutiquePublique = () => {
  const { id } = useParams<{ id: string }>();
  const { isConnected } = useAuth();
  const { contacter, contactEnCours, contactErreur } = useContacter();

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');

  const [panier, setPanier] = useState<LigneCommande[]>([]);
  const [panierOuvert, setPanierOuvert] = useState(false);
  const [livraisonDemandee, setLivraisonDemandee] = useState(false);
  const [adresseLivraison, setAdresseLivraison] = useState<DestinationLivraisonValue>({ ville: '', quartier: '', details: '' });
  const [envoiCommande, setEnvoiCommande] = useState(false);
  const [commandeErreur, setCommandeErreur] = useState('');
  const [commandeReussie, setCommandeReussie] = useState(false);

  useEffect(() => {
    let annule = false;
    setLoading(true);
    setErreur('');
    API.get(`/boutiques/${id}`)
      .then(({ data }) => {
        if (annule) return;
        setBoutique(data.boutique);
        setProduits(data.produits);
      })
      .catch(() => { if (!annule) setErreur("Cette boutique est introuvable ou n'est plus active."); })
      .finally(() => { if (!annule) setLoading(false); });
    return () => { annule = true; };
  }, [id]);

  const ajouterAuPanier = useCallback((produit: Produit) => {
    setPanier((prev) => {
      const existant = prev.find((l) => l.produit._id === produit._id);
      if (existant) {
        if (existant.quantite >= produit.quantiteDisponible) return prev;
        return prev.map((l) => (l.produit._id === produit._id ? { ...l, quantite: l.quantite + 1 } : l));
      }
      return [...prev, { produit, quantite: 1 }];
    });
  }, []);

  const changerQuantite = useCallback((produitId: string, delta: number) => {
    setPanier((prev) => prev
      .map((l) => (l.produit._id === produitId ? { ...l, quantite: Math.min(l.produit.quantiteDisponible, l.quantite + delta) } : l))
      .filter((l) => l.quantite > 0)
    );
  }, []);

  const totalPanier = panier.reduce((somme, l) => somme + l.produit.prix * l.quantite, 0);

  const handleCommander = async () => {
    if (!boutique || panier.length === 0) return;
    if (livraisonDemandee && !adresseLivraison.details?.trim()) {
      setCommandeErreur('Merci de décrire comment trouver votre lieu de livraison.');
      return;
    }
    setEnvoiCommande(true);
    setCommandeErreur('');
    try {
      await API.post('/commandes', {
        boutiqueId: boutique._id,
        articles: panier.map((l) => ({ produitId: l.produit._id, quantite: l.quantite })),
        livraisonDemandee,
        adresseLivraison: livraisonDemandee ? adresseLivraison : undefined,
      });
      setCommandeReussie(true);
      setPanier([]);
    } catch (err: any) {
      setCommandeErreur(err.response?.data?.message || 'Erreur lors de la commande.');
    } finally {
      setEnvoiCommande(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (erreur || !boutique) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <AlertCircle className="w-10 h-10 text-slate-300" />
        <p className="text-slate-500 font-medium">{erreur}</p>
        <Link to="/annonces" className="text-sm font-semibold text-[#007AFF] hover:underline">Retour aux annonces</Link>
      </div>
    );
  }

  const proprietaire = typeof boutique.proprietaire === 'object' ? boutique.proprietaire : null;
  const nombreArticlesPanier = panier.reduce((n, l) => n + l.quantite, 0);

  return (
    <div className="max-w-3xl mx-auto pb-28 animate-fade-in">
      <Link to="/annonces" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#007AFF] mb-4 transition">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      {/* En-tête boutique */}
      <div
        className="rounded-2xl p-5 mb-5 text-white relative overflow-hidden"
        style={{ backgroundColor: boutique.couleurPrincipale || '#007AFF' }}
      >
        {boutique.banniere && (
          <img src={boutique.banniere} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden flex-shrink-0">
            {boutique.logo ? <img src={boutique.logo} alt={boutique.nom} className="w-full h-full object-cover" /> : <Store className="w-6 h-6" />}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-lg truncate">{boutique.nom}</h1>
            {boutique.localisation?.ville && (
              <p className="text-xs opacity-90 flex items-center gap-1"><MapPin className="w-3 h-3" /> {boutique.localisation.ville}</p>
            )}
          </div>
        </div>
        {boutique.description && <p className="relative text-sm opacity-90 mt-3">{boutique.description}</p>}
        {proprietaire && (
          <div className="relative flex items-center justify-between mt-3">
            <p className="text-xs opacity-75">Vendeur : {proprietaire.prenom} {proprietaire.nom}</p>
            {isConnected && (
              <button
                onClick={() => contacter(proprietaire._id, 'produit', boutique._id, boutique.nom)}
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

      {/* Produits */}
      {produits.length === 0 ? (
        <EmptyState icon={Package} title="Cette boutique n'a pas encore de produits." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {produits.map((p) => {
            const ligne = panier.find((l) => l.produit._id === p._id);
            const enRupture = p.quantiteDisponible === 0;
            return (
              <div key={p._id} className="glass rounded-2xl overflow-hidden flex flex-col">
                <div className="h-28 bg-slate-100 flex items-center justify-center overflow-hidden">
                  {p.photos?.[0] ? <img src={p.photos[0]} alt={p.nom} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-slate-300" />}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <p className="text-xs font-medium mb-0.5" style={{ color: getCategorieProduitColor(p.categorie) }}>{p.categorie}</p>
                  <p className="text-sm font-semibold text-slate-900 line-clamp-2 mb-1">{p.nom}</p>
                  <p className="text-sm font-bold text-slate-900 mt-auto mb-2">{p.prix.toLocaleString('fr-FR')} XOF</p>

                  {enRupture ? (
                    <span className="text-xs text-red-500 font-medium text-center py-1.5">Rupture de stock</span>
                  ) : ligne ? (
                    <div className="flex items-center justify-between bg-blue-50 rounded-lg px-2 py-1">
                      <button onClick={() => changerQuantite(p._id, -1)} className="p-1 hover:bg-blue-100 rounded"><Minus className="w-3.5 h-3.5 text-[#007AFF]" /></button>
                      <span className="text-sm font-semibold text-[#007AFF]">{ligne.quantite}</span>
                      <button onClick={() => changerQuantite(p._id, 1)} disabled={ligne.quantite >= p.quantiteDisponible} className="p-1 hover:bg-blue-100 rounded disabled:opacity-40"><Plus className="w-3.5 h-3.5 text-[#007AFF]" /></button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => ajouterAuPanier(p)} className="!rounded-lg !py-1.5 !text-xs w-full">
                      Ajouter
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bouton panier flottant */}
      {nombreArticlesPanier > 0 && !panierOuvert && (
        <button
          onClick={() => setPanierOuvert(true)}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-[#007AFF] text-white px-5 py-3 rounded-full shadow-lg shadow-blue-500/30 font-semibold text-sm"
        >
          <ShoppingCart className="w-4 h-4" />
          {nombreArticlesPanier} article{nombreArticlesPanier > 1 ? 's' : ''} · {totalPanier.toLocaleString('fr-FR')} XOF
        </button>
      )}

      {/* Modale panier / commande */}
      {panierOuvert && (
        <Modal
          open
          onClose={envoiCommande ? undefined : () => setPanierOuvert(false)}
          title={commandeReussie ? undefined : 'Votre commande'}
        >
            {commandeReussie ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                  <Check className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="font-semibold text-slate-900">Commande envoyée !</p>
                <p className="text-sm text-slate-500">{boutique.nom} va confirmer votre commande sous peu.</p>
                <Button
                  onClick={() => { setPanierOuvert(false); setCommandeReussie(false); }}
                  fullWidth
                  className="!bg-slate-900 hover:!bg-slate-800"
                >
                  Fermer
                </Button>
              </div>
            ) : (
              <>

                <div className="space-y-2 mb-4">
                  {panier.map((l) => (
                    <div key={l.produit._id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{l.quantite} × {l.produit.nom}</span>
                      <span className="font-semibold text-slate-900">{(l.produit.prix * l.quantite).toLocaleString('fr-FR')} XOF</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-3 mb-4">
                  <span className="text-sm font-semibold text-slate-700">Total</span>
                  <span className="font-bold text-slate-900">{totalPanier.toLocaleString('fr-FR')} XOF</span>
                </div>

                {produits.some((p) => panier.some((l) => l.produit._id === p._id) && p.livraisonPossible) && (
                  <div className="mb-4">
                    <label className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                      <input
                        type="checkbox"
                        checked={livraisonDemandee}
                        onChange={(e) => setLivraisonDemandee(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#007AFF]"
                      />
                      Je souhaite être livré
                    </label>
                    {livraisonDemandee && (
                      <DestinationLivraison value={adresseLivraison} onChange={setAdresseLivraison} />
                    )}
                  </div>
                )}

                {!isConnected && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <Link to="/connexion" className="underline font-semibold">Connectez-vous</Link>&nbsp;pour valider votre commande.
                  </p>
                )}

                {commandeErreur && (
                  <p className="text-xs text-red-500 flex items-center gap-1.5 mb-3"><AlertCircle className="w-3.5 h-3.5" />{commandeErreur}</p>
                )}

                <Button
                  onClick={handleCommander}
                  disabled={!isConnected || panier.length === 0}
                  loading={envoiCommande}
                  fullWidth
                  size="lg"
                >
                  Valider la commande
                </Button>
              </>
            )}
        </Modal>
      )}
    </div>
  );
};

export default BoutiquePublique;
