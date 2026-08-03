const DemandeLivraison = require('../models/DemandeLivraison');
const Commande = require('../models/Commande');
const CommandeRestaurant = require('../models/CommandeRestaurant');
const { creerNotification } = require('../utils/notifier');

// ─── Créer une demande de livraison à partir d'une commande (vente ou restauration) ───
// POST /api/demandes-livraison
const createDemande = async (req, res) => {
  try {
    const { sourceType, sourceId, adresseRecuperation, tarif } = req.body;

    if (!['vente', 'restauration'].includes(sourceType) || !sourceId) {
      return res.status(400).json({ message: 'Type de commande et identifiant sont obligatoires.' });
    }

    const Model = sourceType === 'vente' ? Commande : CommandeRestaurant;
    const sourceModel = sourceType === 'vente' ? 'Commande' : 'CommandeRestaurant';
    const commande = await Model.findById(sourceId);

    if (!commande) return res.status(404).json({ message: 'Commande introuvable.' });
    if (commande.vendeur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Seul le vendeur de cette commande peut demander une livraison.' });
    }

    const existante = await DemandeLivraison.findOne({ sourceType, sourceId });
    if (existante) {
      return res.status(409).json({ message: 'Une demande de livraison existe déjà pour cette commande.' });
    }

    const demande = await DemandeLivraison.create({
      sourceType,
      sourceId,
      sourceModel,
      vendeur: commande.vendeur,
      client: commande.client,
      adresseRecuperation: adresseRecuperation || {},
      adresseLivraison: commande.adresseLivraison || {},
      tarif: tarif || 0
    });

    res.status(201).json(demande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Demandes disponibles pour les livreurs (non assignées) ───
// GET /api/demandes-livraison/disponibles?ville=
const getDemandesDisponibles = async (req, res) => {
  try {
    const { ville } = req.query;
    const filtre = { statut: 'en_attente' };
    if (ville) filtre['adresseLivraison.ville'] = new RegExp(ville, 'i');

    const demandes = await DemandeLivraison.find(filtre)
      .populate('vendeur', 'nom prenom telephone')
      .sort({ createdAt: -1 });

    res.json(demandes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Accepter une demande (le livreur s'assigne lui-même) ───
// PUT /api/demandes-livraison/:id/accepter
const accepterDemande = async (req, res) => {
  try {
    const demande = await DemandeLivraison.findById(req.params.id);
    if (!demande) return res.status(404).json({ message: 'Demande introuvable.' });
    if (demande.statut !== 'en_attente') {
      return res.status(409).json({ message: 'Cette demande a déjà été prise en charge.' });
    }

    demande.livreur = req.user._id;
    demande.statut = 'assignée';
    await demande.save();

    await creerNotification(
      req.app.get('io'),
      demande.vendeur,
      'demande_livraison_acceptee',
      'Livreur trouvé',
      `${req.user.prenom} ${req.user.nom} a accepté votre demande de livraison.`,
      '/vente'
    );

    res.json(demande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Mettre à jour le statut (livreur assigné uniquement) ───
// PUT /api/demandes-livraison/:id/statut
const updateStatutDemande = async (req, res) => {
  try {
    const { statut } = req.body;
    const statutsValides = ['en_cours', 'livrée', 'annulée'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    const demande = await DemandeLivraison.findById(req.params.id);
    if (!demande) return res.status(404).json({ message: 'Demande introuvable.' });
    if (!demande.livreur || demande.livreur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Seul le livreur assigné peut mettre à jour cette demande.' });
    }

    demande.statut = statut;
    await demande.save();

    if (statut === 'en_cours' || statut === 'livrée') {
      await creerNotification(
        req.app.get('io'),
        demande.client,
        'statut_livraison',
        'Livraison en cours',
        statut === 'en_cours' ? 'Votre livreur est en route.' : 'Votre commande a été livrée.',
        '/profil'
      );
    }

    res.json(demande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Historique des livraisons du livreur connecté ───
// GET /api/demandes-livraison/mes-livraisons
const getMesLivraisons = async (req, res) => {
  try {
    const demandes = await DemandeLivraison.find({ livreur: req.user._id })
      .populate('vendeur', 'nom prenom telephone')
      .sort({ createdAt: -1 });
    res.json(demandes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Demandes créées par le vendeur connecté ───
// GET /api/demandes-livraison/mes-demandes
const getMesDemandes = async (req, res) => {
  try {
    const demandes = await DemandeLivraison.find({ vendeur: req.user._id })
      .populate('livreur', 'nom prenom telephone')
      .sort({ createdAt: -1 });
    res.json(demandes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = {
  createDemande,
  getDemandesDisponibles,
  accepterDemande,
  updateStatutDemande,
  getMesLivraisons,
  getMesDemandes
};
