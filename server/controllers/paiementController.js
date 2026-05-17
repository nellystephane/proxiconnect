const Paiement = require('../models/Paiement');
const Annonce = require('../models/Annonce');

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
        avantages: {
          nombreAnnonces: 1,
          videoAutorisee: false,
          miseEnAvant: false,
          dureeAnnonce: 15
        }
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

// ─── Confirmer un paiement (admin ou webhook) ───
// PUT /api/paiements/:id/confirmer
const confirmerPaiement = async (req, res) => {
  try {
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

module.exports = {
  createPaiement,
  getStatutAbonnement,
  getHistorique,
  confirmerPaiement,
  PRIX,
  AVANTAGES
};