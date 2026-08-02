import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  UtensilsCrossed, MapPin, ShoppingCart, Plus, Minus, X as XIcon,
  AlertCircle, Loader2, Check, ArrowLeft, Flame, MessageCircle
} from 'lucide-react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useContacter } from '../../hooks/useContacter';
import { getCategoriePlatColor } from '../../utils/categoriesPlat';
import type { Restaurant, Plat } from '../../types';

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
  const [adresseLivraison, setAdresseLivraison] = useState({ ville: '', quartier: '', details: '' });
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
    if (modeService === 'livraison' && !adresseLivraison.ville.trim()) {
      setCommandeErreur('Indiquez votre ville pour la livraison.');
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

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="h-8 w-8 border-2 border-blue-200 border-t-[#007AFF] rounded-full animate-spin" /></div>;

  if (erreur || !restaurant) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <AlertCircle className="w-10 h-10 text-slate-300" />
        <p className="text-slate-500 font-medium">{erreur}</p>
        <Link to="/restaurants" className="text-sm font-semibold text-[#007AFF] hover:underline">Retour aux restaurants</Link>
      </div>
    );
  }

  const nombreArticles = panier.reduce((n, l) => n + l.quantite, 0);

  return (
    <div className="max-w-3xl mx-auto pb-28 animate-fade-in">
      <Link to="/restaurants" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#007AFF] mb-4 transition">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <div className="rounded-2xl p-5 mb-5 text-white relative overflow-hidden" style={{ backgroundColor: restaurant.couleurPrincipale || '#007AFF' }}>
        {restaurant.banniere && <img src={restaurant.banniere} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden flex-shrink-0">
            {restaurant.logo ? <img src={restaurant.logo} alt={restaurant.nom} className="w-full h-full object-cover" /> : <UtensilsCrossed className="w-6 h-6" />}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-lg truncate">{restaurant.nom}</h1>
            {restaurant.localisation?.ville && <p className="text-xs opacity-90 flex items-center gap-1"><MapPin className="w-3 h-3" /> {restaurant.localisation.ville}</p>}
          </div>
        </div>
        {restaurant.description && <p className="relative text-sm opacity-90 mt-3">{restaurant.description}</p>}
        {typeof restaurant.proprietaire === 'object' && (
          <div className="relative flex items-center justify-between mt-3">
            <p className="text-xs opacity-75">Restaurateur : {restaurant.proprietaire.prenom} {restaurant.proprietaire.nom}</p>
            {isConnected && (
              <button
                onClick={() => contacter((restaurant.proprietaire as { _id: string })._id, 'plat', restaurant._id, restaurant.nom)}
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

      {Object.keys(platsParCategorie).length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-16">La carte est vide pour le moment.</p>
      ) : (
        Object.entries(platsParCategorie).map(([categorie, platsCategorie]) => (
          <div key={categorie} className="mb-6">
            <h2 className="text-sm font-bold mb-2" style={{ color: getCategoriePlatColor(categorie) }}>{categorie}</h2>
            <div className="space-y-2">
              {platsCategorie.map((p) => {
                const ligne = panier.find((l) => l.plat._id === p._id);
                return (
                  <div key={p._id} className="glass rounded-2xl p-3 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {p.photo ? <img src={p.photo} alt={p.nom} className="w-full h-full object-cover" /> : <UtensilsCrossed className="w-5 h-5 text-slate-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-slate-900 truncate">{p.nom}</p>
                        {p.epice && <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />}
                      </div>
                      <p className="text-sm font-bold text-slate-900">{p.prix.toLocaleString('fr-FR')} XOF</p>
                    </div>
                    {ligne ? (
                      <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-2 py-1 flex-shrink-0">
                        <button onClick={() => changerQuantite(p._id, -1)} className="p-1 hover:bg-blue-100 rounded"><Minus className="w-3.5 h-3.5 text-[#007AFF]" /></button>
                        <span className="text-sm font-semibold text-[#007AFF]">{ligne.quantite}</span>
                        <button onClick={() => changerQuantite(p._id, 1)} className="p-1 hover:bg-blue-100 rounded"><Plus className="w-3.5 h-3.5 text-[#007AFF]" /></button>
                      </div>
                    ) : (
                      <button onClick={() => ajouter(p)} className="text-xs font-semibold text-white bg-[#007AFF] hover:bg-blue-600 transition rounded-lg px-3 py-1.5 flex-shrink-0">Ajouter</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {nombreArticles > 0 && !panierOuvert && (
        <button onClick={() => setPanierOuvert(true)} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-[#007AFF] text-white px-5 py-3 rounded-full shadow-lg shadow-blue-500/30 font-semibold text-sm">
          <ShoppingCart className="w-4 h-4" /> {nombreArticles} article{nombreArticles > 1 ? 's' : ''} · {total.toLocaleString('fr-FR')} XOF
        </button>
      )}

      {panierOuvert && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => !envoiCommande && setPanierOuvert(false)}>
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto glass rounded-3xl shadow-2xl p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {commandeReussie ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center"><Check className="w-7 h-7 text-emerald-500" /></div>
                <p className="font-semibold text-slate-900">Commande envoyée !</p>
                <p className="text-sm text-slate-500">{restaurant.nom} va la préparer sous peu.</p>
                <button onClick={() => { setPanierOuvert(false); setCommandeReussie(false); }} className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition">Fermer</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-slate-900">Votre commande</h2>
                  <button onClick={() => setPanierOuvert(false)} className="p-1.5 rounded-full hover:bg-slate-100"><XIcon className="w-4 h-4 text-slate-500" /></button>
                </div>

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
                    <button onClick={() => setModeService('a_emporter')} className={`py-2.5 rounded-xl text-xs font-medium border transition ${modeService === 'a_emporter' ? 'border-[#007AFF] bg-blue-50 text-[#007AFF]' : 'border-slate-200 text-slate-500'}`}>À emporter</button>
                  )}
                  {restaurant.serviceSurPlace && (
                    <button onClick={() => setModeService('sur_place')} className={`py-2.5 rounded-xl text-xs font-medium border transition ${modeService === 'sur_place' ? 'border-[#007AFF] bg-blue-50 text-[#007AFF]' : 'border-slate-200 text-slate-500'}`}>Sur place</button>
                  )}
                  <button onClick={() => setModeService('livraison')} className={`py-2.5 rounded-xl text-xs font-medium border transition ${modeService === 'livraison' ? 'border-[#007AFF] bg-blue-50 text-[#007AFF]' : 'border-slate-200 text-slate-500'}`}>Livraison</button>
                </div>

                {modeService === 'livraison' && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <input
                      value={adresseLivraison.ville}
                      onChange={(e) => setAdresseLivraison({ ...adresseLivraison, ville: e.target.value })}
                      placeholder="Ville"
                      className="w-full px-3 py-2.5 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <input
                      value={adresseLivraison.quartier}
                      onChange={(e) => setAdresseLivraison({ ...adresseLivraison, quartier: e.target.value })}
                      placeholder="Quartier"
                      className="w-full px-3 py-2.5 bg-gray-100/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                )}

                {!isConnected && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <Link to="/connexion" className="underline font-semibold">Connectez-vous</Link>&nbsp;pour valider votre commande.
                  </p>
                )}

                {commandeErreur && <p className="text-xs text-red-500 flex items-center gap-1.5 mb-3"><AlertCircle className="w-3.5 h-3.5" />{commandeErreur}</p>}

                <button onClick={handleCommander} disabled={!isConnected || envoiCommande || panier.length === 0} className="w-full py-3.5 bg-[#007AFF] text-white rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {envoiCommande && <Loader2 className="w-4 h-4 animate-spin" />} Valider la commande
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantPublique;
