const Commande = require('../models/Commande');
const Produit = require('../models/Produit');
const Boutique = require('../models/Boutique');
const { creerNotification } = require('../utils/notifier');

// ─── Passer une commande ───
// POST /api/commandes
const createCommande = async (req, res) => {
  try {
    const { boutiqueId, articles, livraisonDemandee, adresseLivraison, note } = req.body;

    if (!boutiqueId || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ message: 'La commande doit contenir au moins un article.' });
    }

    // ─── Localisation de livraison : la description du lieu ("comment
    // trouver...") est obligatoire dès qu'une livraison est demandée ; les
    // coordonnées GPS restent toujours facultatives (contexte ouest-africain :
    // le repère humain prime sur le point GPS). Les commandes sans livraison
    // ne sont pas concernées, et les anciennes commandes ne sont pas rejouées
    // par cette validation. ───
    let adresseLivraisonFinale = {};
    if (livraisonDemandee) {
      const description = (adresseLivraison?.details || '').trim();
      if (!description) {
        return res.status(400).json({ message: 'Merci de décrire comment trouver votre lieu de livraison.' });
      }
      adresseLivraisonFinale = {
        ville: (adresseLivraison?.ville || '').trim(),
        quartier: (adresseLivraison?.quartier || '').trim(),
        details: description,
        latitude: typeof adresseLivraison?.latitude === 'number' ? adresseLivraison.latitude : null,
        longitude: typeof adresseLivraison?.longitude === 'number' ? adresseLivraison.longitude : null,
        mapUrl: (adresseLivraison?.mapUrl || '').trim(),
        formattedAddress: (adresseLivraison?.formattedAddress || '').trim()
      };
    }

    const boutique = await Boutique.findById(boutiqueId);
    if (!boutique) return res.status(404).json({ message: 'Boutique introuvable.' });

    if (boutique.proprietaire.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas commander dans votre propre boutique.' });
    }

    // ─── Vérifier chaque produit et son stock, recopier prix/nom au moment T ───
    const articlesValides = [];
    let montantTotal = 0;

    for (const item of articles) {
      const produit = await Produit.findById(item.produitId);
      if (!produit || produit.boutique.toString() !== boutiqueId) {
        return res.status(400).json({ message: `Produit invalide dans la commande.` });
      }
      const quantite = Math.max(1, parseInt(item.quantite) || 1);
      if (produit.quantiteDisponible < quantite) {
        return res.status(409).json({ message: `Stock insuffisant pour "${produit.nom}" (${produit.quantiteDisponible} disponible(s)).` });
      }

      articlesValides.push({
        produit: produit._id,
        nom: produit.nom,
        prixUnitaire: produit.prix,
        quantite,
        varianteChoisie: item.varianteChoisie || ''
      });
      montantTotal += produit.prix * quantite;
    }

    const commande = await Commande.create({
      client: req.user._id,
      vendeur: boutique.proprietaire,
      boutique: boutique._id,
      articles: articlesValides,
      montantTotal,
      livraisonDemandee: !!livraisonDemandee,
      adresseLivraison: adresseLivraisonFinale,
      note: note || ''
    });

    // ─── Décrémenter le stock ───
    for (const item of articlesValides) {
      await Produit.findByIdAndUpdate(item.produit, { $inc: { quantiteDisponible: -item.quantite } });
    }

    await creerNotification(
      req.app.get('io'),
      boutique.proprietaire,
      'nouvelle_commande',
      'Nouvelle commande',
      `${req.user.prenom} ${req.user.nom} a passé une commande de ${montantTotal.toLocaleString('fr-FR')} XOF sur ${boutique.nom}.`,
      '/vente'
    );

    res.status(201).json(commande);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Mes commandes passées (en tant que client) ───
// GET /api/commandes/mes-achats
const getMesAchats = async (req, res) => {
  try {
    const commandes = await Commande.find({ client: req.user._id })
      .populate('boutique', 'nom logo')
      .sort({ createdAt: -1 });
    res.json(commandes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Commandes reçues (en tant que vendeur) ───
// GET /api/commandes/recues
const getCommandesRecues = async (req, res) => {
  try {
    const commandes = await Commande.find({ vendeur: req.user._id })
      .populate('client', 'nom prenom photo telephone')
      .sort({ createdAt: -1 });
    res.json(commandes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Mettre à jour le statut d'une commande (vendeur uniquement) ───
// PUT /api/commandes/:id/statut
const updateStatutCommande = async (req, res) => {
  try {
    const { statut } = req.body;
    const statutsValides = ['en_attente', 'confirmée', 'expédiée', 'livrée', 'annulée'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    const commande = await Commande.findById(req.params.id);
    if (!commande) return res.status(404).json({ message: 'Commande non trouvée.' });
    if (commande.vendeur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Seul le vendeur peut mettre à jour cette commande.' });
    }

    // Si la commande est annulée, on restitue le stock réservé.
    if (statut === 'annulée' && commande.statut !== 'annulée') {
      for (const item of commande.articles) {
        await Produit.findByIdAndUpdate(item.produit, { $inc: { quantiteDisponible: item.quantite } });
      }
    }

    commande.statut = statut;
    await commande.save();

    await creerNotification(
      req.app.get('io'),
      commande.client,
      'statut_commande',
      'Commande mise à jour',
      `Votre commande est maintenant : ${statut.replace('_', ' ')}.`,
      '/profil'
    );

    res.json(commande);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  createCommande,
  getMesAchats,
  getCommandesRecues,
  updateStatutCommande
};
