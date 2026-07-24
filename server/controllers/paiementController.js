const Paiement = require('../models/Paiement');
const Annonce = require('../models/Annonce');
const { AVANTAGES_GRATUIT } = require('../utils/abonnement');

// ─── Avantages selon le type d'abonnement ───
const AVANTAGES = {
  abonnement_30j: {
    nombreAnnonces: 5,
    videoAutorisee: true,
    miseEnAvant: false,
    dureeAnnonce: 30
  },
  abonnement_90j: {
    nombreAnnonces: 10,
    videoAutorisee: true,
    miseEnAvant: false,
    dureeAnnonce: 90
  },
  abonnement_annuel: {
    nombreAnnonces: 10,
    videoAutorisee: true,
    miseEnAvant: true,
    dureeAnnonce: 360
  }
};

// ─── Prix des abonnements ───
const PRIX = {
  abonnement_30j: 2000,    // 2000 XOF
  abonnement_90j: 5000,    // 5000 XOF
  abonnement_annuel: 15000  // 15000 XOF (attractif)
};

// ─── Liste des offres disponibles ───
// GET /api/paiements/offres
const getOffres = async (req, res) => {
  res.json([
    { type: 'gratuit', label: 'Gratuit', prix: 0, duree: 'Illimitée', avantages: AVANTAGES_GRATUIT },
    { type: 'abonnement_30j', label: '30 jours', prix: PRIX.abonnement_30j, duree: '30 jours', avantages: AVANTAGES.abonnement_30j },
    { type: 'abonnement_90j', label: '90 jours', prix: PRIX.abonnement_90j, duree: '90 jours', avantages: AVANTAGES.abonnement_90j },
    { type: 'abonnement_annuel', label: 'Annuel', prix: PRIX.abonnement_annuel, duree: '360 jours', avantages: AVANTAGES.abonnement_annuel }
  ]);
};

// ─── Créer un paiement (initier un abonnement) ───
// POST /api/paiements
const createPaiement = async (req, res) => {
  try {
    const { type, methode, operateur, numeroTransaction } = req.body;

    if (!type || !methode) {
      return res.status(400).json({ message: 'Type d\'abonnement et méthode de paiement sont obligatoires.' });
    }

    if (!['abonnement_30j', 'abonnement_90j', 'abonnement_annuel'].includes(type)) {
      return res.status(400).json({ message: 'Type d\'abonnement invalide.' });
    }

    const montant = PRIX[type];
    const avantages = AVANTAGES[type];

    // Calculer les dates
    const dateDebut = new Date();
    const dateFin = new Date();

    switch (type) {
      case 'abonnement_30j':
        dateFin.setDate(dateFin.getDate() + 30);
        break;
      case 'abonnement_90j':
        dateFin.setDate(dateFin.getDate() + 90);
        break;
      case 'abonnement_annuel':
        dateFin.setFullYear(dateFin.getFullYear() + 1);
        break;
    }

    const paiement = await Paiement.create({
      utilisateur: req.user._id,
      type,
      avantages,
      montant,
      methode,
      operateur: operateur || null,
      numeroTransaction: numeroTransaction || null,
      dateDebut,
      dateFin
    });

    // Mettre à jour les annonces existantes avec les nouveaux avantages
    if (avantages.miseEnAvant) {
      await Annonce.updateMany(
        { createur: req.user._id, statut: 'actif' },
        { estMiseEnAvant: true }
      );
    }

    await Annonce.updateMany(
      { createur: req.user._id, statut: 'actif' },
      { estPremium: true }
    );

    res.status(201).json(paiement);

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Vérifier le statut de l'abonnement ───
// GET /api/paiements/statut
const getStatutAbonnement = async (req, res) => {
  try {
    // Trouver le paiement actif le plus récent
    const paiementActif = await Paiement.findOne({
      utilisateur: req.user._id,
      statut: 'confirmé',
      dateFin: { $gt: new Date() }
    }).sort({ dateFin: -1 });

    if (!paiementActif) {
      return res.json({
        estAbonne: false,
        avantages: AVANTAGES_GRATUIT
      });
    }

    res.json({
      estAbonne: true,
      type: paiementActif.type,
      avantages: paiementActif.avantages,
      dateDebut: paiementActif.dateDebut,
      dateFin: paiementActif.dateFin,
      joursRestants: Math.ceil((new Date(paiementActif.dateFin) - new Date()) / (1000 * 60 * 60 * 24))
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Historique des paiements ───
// GET /api/paiements/historique
const getHistorique = async (req, res) => {
  try {
    const paiements = await Paiement.find({ utilisateur: req.user._id })
      .sort({ createdAt: -1 });

    res.json(paiements);

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Confirmer un paiement (webhook opérateur Mobile Money) ───
// PUT /api/paiements/:id/confirmer
// ⚠️ Cette route est destinée au webhook du fournisseur Mobile Money, pas à
// un utilisateur final : elle est protégée par une clé secrète partagée
// (WEBHOOK_SECRET) en plus de l'authentification, pour éviter qu'un membre
// puisse confirmer un paiement (le sien ou celui d'un tiers) sans paiement réel.
const confirmerPaiement = async (req, res) => {
  try {
    const secretAttendu = process.env.WEBHOOK_SECRET;
    if (!secretAttendu || req.headers['x-webhook-secret'] !== secretAttendu) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const paiement = await Paiement.findById(req.params.id);

    if (!paiement) {
      return res.status(404).json({ message: 'Paiement non trouvé.' });
    }

    paiement.statut = 'confirmé';
    await paiement.save();

    // Appliquer les avantages aux annonces
    if (paiement.avantages.miseEnAvant) {
      await Annonce.updateMany(
        { createur: paiement.utilisateur, statut: 'actif' },
        { estMiseEnAvant: true }
      );
    }

    await Annonce.updateMany(
      { createur: paiement.utilisateur, statut: 'actif' },
      { estPremium: true }
    );

    res.json({ message: 'Paiement confirmé.', paiement });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Confirmation en mode démonstration ───
// PUT /api/paiements/:id/simuler
// ⚠️ Provisoire : en attendant l'intégration réelle des webhooks Mobile Money
// (Orange, MTN, Moov, Wave, Celtiis), cette route permet à l'utilisateur de
// confirmer lui-même son paiement afin de tester le parcours d'abonnement.
// À retirer/sécuriser dès qu'un vrai fournisseur de paiement est branché :
// la confirmation devra alors provenir uniquement du webhook de l'opérateur.
const simulerConfirmation = async (req, res) => {
  try {
    const paiement = await Paiement.findById(req.params.id);

    if (!paiement) {
      return res.status(404).json({ message: 'Paiement non trouvé.' });
    }

    if (paiement.utilisateur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Ce paiement ne vous appartient pas.' });
    }

    if (paiement.statut === 'confirmé') {
      return res.json({ message: 'Ce paiement est déjà confirmé.', paiement });
    }

    paiement.statut = 'confirmé';
    await paiement.save();

    if (paiement.avantages.miseEnAvant) {
      await Annonce.updateMany(
        { createur: paiement.utilisateur, statut: 'actif' },
        { estMiseEnAvant: true }
      );
    }

    await Annonce.updateMany(
      { createur: paiement.utilisateur, statut: 'actif' },
      { estPremium: true }
    );

    res.json({ message: 'Paiement confirmé avec succès.', paiement });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = {
  createPaiement,
  getStatutAbonnement,
  getHistorique,
  confirmerPaiement,
  simulerConfirmation,
  getOffres,
  PRIX,
  AVANTAGES
};