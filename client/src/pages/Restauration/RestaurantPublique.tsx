import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  UtensilsCrossed, MapPin, ShoppingCart, Plus, Minus,
  AlertCircle, Loader2, Check, ArrowLeft, Flame, MessageCircle
} from 'lucide-react';
import API from '../../api/axios';
import { Spinner, EmptyState, Modal, Button } from '../../components/ui';
import DestinationLivraison from '../../components/DestinationLivraison/DestinationLivraison';
import { useAuth } from '../../context/AuthContext';
import { useContacter } from '../../hooks/useContacter';
import { getCategoriePlatColor } from '../../utils/categoriesPlat';
import type { Restaurant, Plat, DestinationLivraison as DestinationLivraisonValue } from '../../types';

interface LigneCommande { plat: Plat; quantite: number; }

const RestaurantPublique = () => {
  const { id } = useParams<{ id: string }>();
  const { isConnected } = useAuth();
  const { contacter, contactEnCours, contactErreur } = useContacter();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');

  const [panier, setPanier] = useState<LigneCommande[]>([]);
  const [panierOuvert, setPanierOuvert] = useState(false);
  const [modeService, setModeService] = useState<'sur_place' | 'a_emporter' | 'livraison'>('a_emporter');
  const [adresseLivraison, setAdresseLivraison] = useState<DestinationLivraisonValue>({ ville: '', quartier: '', details: '' });
  const [envoiCommande, setEnvoiCommande] = useState(false);
  const [commandeErreur, setCommandeErreur] = useState('');
  const [commandeReussie, setCommandeReussie] = useState(false);

  useEffect(() => {
    let annule = false;
    setLoading(true);
    setErreur('');
    API.get(`/restaurants/${id}`)
      .then(({ data }) => { if (!annule) { setRestaurant(data.restaurant); setPlats(data.plats); } })
      .catch(() => { if (!annule) setErreur("Ce restaurant est introuvable ou n'est plus actif."); })
      .finally(() => { if (!annule) setLoading(false); });
    return () => { annule = true; };
  }, [id]);

  const ajouter = useCallback((plat: Plat) => {
    setPanier((prev) => {
      const existant = prev.find((l) => l.plat._id === plat._id);
      if (existant) return prev.map((l) => (l.plat._id === plat._id ? { ...l, quantite: l.quantite + 1 } : l));
      return [...prev, { plat, quantite: 1 }];
    });
  }, []);

  const changerQuantite = useCallback((platId: string, delta: number) => {
    setPanier((prev) => prev.map((l) => (l.plat._id === platId ? { ...l, quantite: l.quantite + delta } : l)).filter((l) => l.quantite > 0));
  }, []);

  const total = panier.reduce((s, l) => s + l.plat.prix * l.quantite, 0);
  const platsParCategorie = plats.reduce<Record<string, Plat[]>>((acc, p) => {
    (acc[p.categorie] ||= []).push(p);
    return acc;
  }, {});

  const handleCommander = async () => {
    if (!restaurant || panier.length === 0) return;
    if (modeService === 'livraison' && !adresseLivraison.details?.trim()) {
      setCommandeErreur('Merci de décrire comment trouver votre lieu de livraison.');
      return;
    }
    setEnvoiCommande(true);
    setCommandeErreur('');
    try {
      await API.post('/commandes-restaurant', {
        restaurantId: restaurant._id,
        articles: panier.map((l) => ({ platId: l.plat._id, quantite: l.quantite })),
        modeService,
        adresseLivraison: modeService === 'livraison' ? adresseLivraison : undefined,
      });
      setCommandeReussie(true);
      setPanier([]);
    } catch (err: any) {
      setCommandeErreur(err.response?.data?.message || 'Erreur lors de la commande.');
    } finally {
      setEnvoiCommande(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Spinner size="lg" /></div>;

  if (erreur || !restaurant) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <AlertCircle className="w-10 h-10 text-slate-300" />
        <p className="text-slate-500 font-medium">{erreur}</p>
        <Link to="/restaurants" className="text-sm font-semibold text-primary hover:underline">Retour aux restaurants</Link>
      </div>
    );
  }

  const nombreArticles = panier.reduce((n, l) => n + l.quantite, 0);

  return (
    <div className="max-w-3xl mx-auto pb-28 animate-fade-in">
      <Link to="/restaurants" className="glass-pill inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary mb-4 no-underline transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      {/* ── Vitrine restaurant : héro verre sur bannière ── */}
      <div className="glass-elevated relative rounded-[26px] p-5 sm:p-6 mb-5 overflow-hidden animate-slide-up">
        {restaurant.banniere && <img src={restaurant.banniere} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${(restaurant.couleurPrincipale || '#FF9F0A')}E6 0%, ${(restaurant.couleurPrincipale || '#FF9F0A')}99 100%)` }}
          aria-hidden="true"
        />
        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/25">
              {restaurant.logo ? <img src={restaurant.logo} alt={restaurant.nom} className="w-full h-full object-cover" /> : <UtensilsCrossed className="w-6 h-6 text-white" strokeWidth={2.1} />}
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg text-white truncate tracking-tight">{restaurant.nom}</h1>
              {restaurant.localisation?.ville && <p className="text-xs text-white/85 flex items-center gap-1"><MapPin className="w-3 h-3" /> {restaurant.localisation.ville}</p>}
            </div>
          </div>
          {restaurant.description && <p className="text-sm text-white/90 mt-3 max-w-xl">{restaurant.description}</p>}
          {typeof restaurant.proprietaire === 'object' && (
            <div className="flex items-center justify-between gap-3 mt-4">
              <p className="text-xs text-white/75">Restaurateur : {restaurant.proprietaire.prenom} {restaurant.proprietaire.nom}</p>
              {isConnected && (
                <button
                  onClick={() => contacter((restaurant.proprietaire as { _id: string })._id, 'plat', restaurant._id, restaurant.nom)}
                  disabled={contactEnCours}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-white/20 backdrop-blur px-3.5 py-2 rounded-full text-white hover:bg-white/30 transition disabled:opacity-60 active:scale-95"
                >
                  {contactEnCours ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />} Contacter
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {contactErreur && (
        <p className="text-xs text-red-500 mb-3 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{contactErreur}</p>
      )}

      {/* ── Carte : sections par catégorie, plats en cartes visuelles ── */}
      {Object.keys(platsParCategorie).length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="La carte est vide pour le moment." />
      ) : (
        Object.entries(platsParCategorie).map(([categorie, platsCategorie]) => (
          <div key={categorie} className="mb-6">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoriePlatColor(categorie) }} />
              <h2 className="text-sm font-bold text-slate-900">{categorie}</h2>
              <span className="text-[10px] font-semibold text-slate-400">{platsCategorie.length} plat{platsCategorie.length > 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-2.5">
              {platsCategorie.map((p) => {
                const ligne = panier.find((l) => l.plat._id === p._id);
                return (
                  <div
                    key={p._id}
                    className="glass rounded-[20px] p-3 flex items-center gap-3 hover:shadow-md transition-all duration-300"
                    style={{ boxShadow: `var(--glass-specular), 0 10px 24px -14px ${getCategoriePlatColor(p.categorie)}55` }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {p.photos?.[0] ? <img src={p.photos[0]} alt={p.nom} className="w-full h-full object-cover" loading="lazy" /> : <UtensilsCrossed className="w-5 h-5 text-slate-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-slate-900 truncate">{p.nom}</p>
                        {p.epice && <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" aria-label="Épicé" />}
                      </div>
                      <p className="text-sm font-bold text-primary mt-0.5">{p.prix.toLocaleString('fr-FR')} XOF</p>
                    </div>
                    {ligne ? (
                      <div className="glass-pill flex items-center gap-1 rounded-full px-1.5 py-1 flex-shrink-0">
                        <button onClick={() => changerQuantite(p._id, -1)} className="p-1.5 rounded-full hover:bg-primary/10 transition-colors" aria-label="Retirer"><Minus className="w-3.5 h-3.5 text-primary" /></button>
                        <span className="text-sm font-bold text-primary min-w-4 text-center">{ligne.quantite}</span>
                        <button onClick={() => changerQuantite(p._id, 1)} className="p-1.5 rounded-full hover:bg-primary/10 transition-colors" aria-label="Ajouter"><Plus className="w-3.5 h-3.5 text-primary" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => ajouter(p)}
                        className="text-xs font-semibold text-white rounded-full px-3.5 py-2 flex-shrink-0 active:scale-95 transition-transform"
                        style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow-primary)' }}
                      >
                        Ajouter
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {nombreArticles > 0 && !panierOuvert && (
        <button onClick={() => setPanierOuvert(true)} className="btn-liquid-primary fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm">
          <ShoppingCart className="w-4 h-4" /> {nombreArticles} article{nombreArticles > 1 ? 's' : ''} · {total.toLocaleString('fr-FR')} XOF
        </button>
      )}

      {panierOuvert && (
        <Modal
          open
          onClose={() => !envoiCommande && setPanierOuvert(false)}
          title={!commandeReussie ? 'Votre commande' : undefined}
          showCloseButton={!commandeReussie}
        >
            {commandeReussie ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center"><Check className="w-7 h-7 text-emerald-500" /></div>
                <p className="font-semibold text-slate-900">Commande envoyée !</p>
                <p className="text-sm text-slate-500">{restaurant.nom} va la préparer sous peu.</p>
                <Button onClick={() => { setPanierOuvert(false); setCommandeReussie(false); }} fullWidth className="!bg-slate-900 hover:!bg-slate-800">Fermer</Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {panier.map((l) => (
                    <div key={l.plat._id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{l.quantite} × {l.plat.nom}</span>
                      <span className="font-semibold text-slate-900">{(l.plat.prix * l.quantite).toLocaleString('fr-FR')} XOF</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-3 mb-4">
                  <span className="text-sm font-semibold text-slate-700">Total</span>
                  <span className="font-bold text-slate-900">{total.toLocaleString('fr-FR')} XOF</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {restaurant.serviceAEmporter && (
                    <button onClick={() => setModeService('a_emporter')} className={`py-2.5 rounded-xl text-xs font-semibold border transition ${modeService === 'a_emporter' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>À emporter</button>
                  )}
                  {restaurant.serviceSurPlace && (
                    <button onClick={() => setModeService('sur_place')} className={`py-2.5 rounded-xl text-xs font-semibold border transition ${modeService === 'sur_place' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>Sur place</button>
                  )}
                  <button onClick={() => setModeService('livraison')} className={`py-2.5 rounded-xl text-xs font-semibold border transition ${modeService === 'livraison' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>Livraison</button>
                </div>

                {modeService === 'livraison' && (
                  <div className="mb-4">
                    <DestinationLivraison value={adresseLivraison} onChange={setAdresseLivraison} />
                  </div>
                )}

                {!isConnected && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <Link to="/connexion" className="underline font-semibold">Connectez-vous</Link>&nbsp;pour valider votre commande.
                  </p>
                )}

                {commandeErreur && <p className="text-xs text-red-500 flex items-center gap-1.5 mb-3"><AlertCircle className="w-3.5 h-3.5" />{commandeErreur}</p>}

                <Button onClick={handleCommander} disabled={!isConnected || panier.length === 0} loading={envoiCommande} fullWidth size="lg">
                  Valider la commande
                </Button>
              </>
            )}
        </Modal>
      )}
    </div>
  );
};

export default RestaurantPublique;
