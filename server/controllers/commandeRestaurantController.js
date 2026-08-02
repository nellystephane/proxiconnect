const CommandeRestaurant = require('../models/CommandeRestaurant');
const Plat = require('../models/Plat');
const Restaurant = require('../models/Restaurant');
const { creerNotification } = require('../utils/notifier');

// ─── Passer une commande au restaurant ───
// POST /api/commandes-restaurant
const createCommande = async (req, res) => {
  try {
    const { restaurantId, articles, modeService, adresseLivraison, note } = req.body;

    if (!restaurantId || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ message: 'La commande doit contenir au moins un plat.' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant introuvable.' });

    if (restaurant.proprietaire.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas commander dans votre propre restaurant.' });
    }

    const articlesValides = [];
    let montantTotal = 0;

    for (const item of articles) {
      const plat = await Plat.findById(item.platId);
      if (!plat || plat.restaurant.toString() !== restaurantId || !plat.disponible) {
        return res.status(400).json({ message: `Plat invalide ou indisponible dans la commande.` });
      }
      const quantite = Math.max(1, parseInt(item.quantite) || 1);
      articlesValides.push({ plat: plat._id, nom: plat.nom, prixUnitaire: plat.prix, quantite });
      montantTotal += plat.prix * quantite;
    }

    const commande = await CommandeRestaurant.create({
      client: req.user._id,
      vendeur: restaurant.proprietaire,
      restaurant: restaurant._id,
      articles: articlesValides,
      montantTotal,
      modeService: modeService || 'a_emporter',
      adresseLivraison: adresseLivraison || {},
      note: note || ''
    });

    await creerNotification(
      req.app.get('io'),
      restaurant.proprietaire,
      'nouvelle_commande',
      'Nouvelle commande',
      `Vous avez reçu une nouvelle commande de ${montantTotal.toLocaleString('fr-FR')} XOF sur ${restaurant.nom}.`,
      '/restauration'
    );

    res.status(201).json(commande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Mes commandes passées ───
// GET /api/commandes-restaurant/mes-achats
const getMesAchats = async (req, res) => {
  try {
    const commandes = await CommandeRestaurant.find({ client: req.user._id })
      .populate('restaurant', 'nom logo')
      .sort({ createdAt: -1 });
    res.json(commandes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Commandes reçues (restaurateur) ───
// GET /api/commandes-restaurant/recues
const getCommandesRecues = async (req, res) => {
  try {
    const commandes = await CommandeRestaurant.find({ vendeur: req.user._id })
      .populate('client', 'nom prenom photo telephone')
      .sort({ createdAt: -1 });
    res.json(commandes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Mettre à jour le statut ───
// PUT /api/commandes-restaurant/:id/statut
const updateStatutCommande = async (req, res) => {
  try {
    const { statut } = req.body;
    const statutsValides = ['en_attente', 'en_préparation', 'prête', 'livrée', 'annulée'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    const commande = await CommandeRestaurant.findById(req.params.id);
    if (!commande) return res.status(404).json({ message: 'Commande non trouvée.' });
    if (commande.vendeur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Seul le restaurateur peut mettre à jour cette commande.' });
    }

    commande.statut = statut;
    await commande.save();

    await creerNotification(
      req.app.get('io'),
      commande.client,
      'statut_commande',
      'Commande mise à jour',
      `Votre commande au restaurant est maintenant : ${statut.replace('_', ' ')}.`,
      '/profil'
    );

    res.json(commande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { createCommande, getMesAchats, getCommandesRecues, updateStatutCommande };
