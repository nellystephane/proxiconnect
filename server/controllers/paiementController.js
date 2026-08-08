const Paiement = require('../models/Paiement');
const { creerNotification } = require('../utils/notifier');
const Annonce = require('../models/Annonce');
const Boutique = require('../models/Boutique');
const Restaurant = require('../models/Restaurant');
const Hotel = require('../models/Hotel');
const Livreur = require('../models/Livreur');
const { AVANTAGES_GRATUIT } = require('../utils/abonnement');

// ─── Modèles des espaces métiers, par type ───
const MODELES_ESPACE = {
  vente: Boutique,
  restauration: Restaurant,
  hotel: Hotel,
  livraison: Livreur
};

// ─── Abonnement "Pro" des espaces métiers (Vente/Restauration/Hôtel/Livraison) ───
// Distinct de l'abonnement annonces classique : donne accès à la mise en avant
// des produits/plats/chambres de l'espace. Même grille tarifaire pour tous les
// espaces, pour rester simple.
const PRIX_PRO = {
  pro_mensuel: 5000,   // 5 000 XOF / mois
  pro_annuel: 45000    // 45 000 XOF / an (vs 60 000 XOF si payé au mois)
};

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
    nombreAnnonces: 999999, // "illimité" en pratique (JSON ne supporte pas Infinity)
    videoAutorisee: true,
    miseEnAvant: true,
    dureeAnnonce: 360
  }
};

// ─── Prix des abonnements (cf. cahier des charges) ───
const PRIX = {
  abonnement_30j: 4900,     // 4 900 XOF
  abonnement_90j: 8500,     // 8 500 XOF
  abonnement_annuel: 32000  // 32 000 XOF (très avantageux vs. 4900 × 12)
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

// ─── Offres Pro disponibles (identiques pour tous les espaces) ───
// GET /api/paiements/offres-pro
const getOffresPro = async (req, res) => {
  res.json([
    { type: 'pro_mensuel', label: 'Pro mensuel', prix: PRIX_PRO.pro_mensuel, duree: '30 jours' },
    { type: 'pro_annuel', label: 'Pro annuel', prix: PRIX_PRO.pro_annuel, duree: '360 jours' }
  ]);
};

// ─── Initier un paiement Pro pour un espace métier ───
// POST /api/paiements/pro
const createPaiementPro = async (req, res) => {
  try {
    const { type, espaceType, methode, operateur, numeroTransaction } = req.body;

    if (!type || !espaceType || !methode) {
      return res.status(400).json({ message: 'Type d\'abonnement, espace et méthode de paiement sont obligatoires.' });
    }
    if (!PRIX_PRO[type]) {
      return res.status(400).json({ message: 'Type d\'abonnement Pro invalide.' });
    }
    const Modele = MODELES_ESPACE[espaceType];
    if (!Modele) {
      return res.status(400).json({ message: "Espace métier invalide." });
    }

    // Le champ propriétaire varie selon l'espace (proprietaire pour Boutique/Restaurant/Hotel, utilisateur pour Livreur)
    const champProprietaire = espaceType === 'livraison' ? 'utilisateur' : 'proprietaire';
    const espace = await Modele.findOne({ [champProprietaire]: req.user._id });
    if (!espace) {
      return res.status(404).json({ message: "Vous n'avez pas encore activé cet espace." });
    }

    const montant = PRIX_PRO[type];
    const dateDebut = new Date();
    const dateFin = new Date();
    if (type === 'pro_mensuel') dateFin.setDate(dateFin.getDate() + 30);
    else dateFin.setFullYear(dateFin.getFullYear() + 1);

    const paiement = await Paiement.create({
      utilisateur: req.user._id,
      type,
      espaceType,
      espaceId: espace._id,
      montant,
      methode,
      operateur: operateur || null,
      numeroTransaction: numeroTransaction || null,
      dateDebut,
      dateFin
    });

    res.status(201).json(paiement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Statut de l'abonnement Pro d'un espace précis ───
// GET /api/paiements/statut-pro?espaceType=&espaceId=
const getStatutPro = async (req, res) => {
  try {
    const { espaceType, espaceId } = req.query;
    const Modele = MODELES_ESPACE[espaceType];
    if (!Modele || !espaceId) {
      return res.status(400).json({ message: 'Espace métier invalide.' });
    }

    const espace = await Modele.findById(espaceId);
    if (!espace) return res.status(404).json({ message: 'Espace introuvable.' });

    // L'abonnement peut avoir expiré depuis la dernière vérification
    if (espace.abonnementPro?.actif && espace.abonnementPro.dateFin && new Date(espace.abonnementPro.dateFin) < new Date()) {
      espace.abonnementPro.actif = false;
      await espace.save();
    }

    res.json(espace.abonnementPro || { actif: false, plan: null, dateFin: null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Active l'abonnement Pro de l'espace lié à un paiement confirmé ───
const activerAbonnementPro = async (paiement) => {
  const Modele = MODELES_ESPACE[paiement.espaceType];
  if (!Modele) return;
  await Modele.findByIdAndUpdate(paiement.espaceId, {
    abonnementPro: { actif: true, plan: paiement.type, dateFin: paiement.dateFin }
  });
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
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
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
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
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
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
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

    if (paiement.espaceType) {
      await activerAbonnementPro(paiement);
      await creerNotification(
        req.app.get('io'),
        paiement.utilisateur,
        'paiement_confirme',
        'Abonnement Pro activé',
        'Votre paiement a été confirmé et votre abonnement Pro est actif.',
        '/mon-espace'
      );
      return res.json({ message: 'Paiement confirmé.', paiement });
    }

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

    await creerNotification(
      req.app.get('io'),
      paiement.utilisateur,
      'paiement_confirme',
      'Abonnement activé',
      'Votre paiement a été confirmé et votre abonnement est actif.',
      '/abonnements'
    );

    res.json({ message: 'Paiement confirmé.', paiement });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
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

    if (paiement.espaceType) {
      await activerAbonnementPro(paiement);
      await creerNotification(
        req.app.get('io'),
        paiement.utilisateur,
        'paiement_confirme',
        'Abonnement Pro activé',
        'Votre paiement a été confirmé et votre abonnement Pro est actif.',
        '/mon-espace'
      );
      return res.json({ message: 'Paiement confirmé avec succès.', paiement });
    }

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

    await creerNotification(
      req.app.get('io'),
      paiement.utilisateur,
      'paiement_confirme',
      'Abonnement activé',
      'Votre paiement a été confirmé et votre abonnement est actif.',
      '/abonnements'
    );

    res.json({ message: 'Paiement confirmé avec succès.', paiement });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Détail d'un paiement (pour le suivi du statut côté client) ───
// GET /api/paiements/:id
const getPaiementById = async (req, res) => {
  try {
    const paiement = await Paiement.findById(req.params.id);

    if (!paiement) {
      return res.status(404).json({ message: 'Paiement non trouvé.' });
    }

    if (paiement.utilisateur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Ce paiement ne vous appartient pas.' });
    }

    res.json(paiement);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  createPaiement,
  getStatutAbonnement,
  getHistorique,
  getPaiementById,
  confirmerPaiement,
  simulerConfirmation,
  getOffres,
  getOffresPro,
  createPaiementPro,
  getStatutPro,
  PRIX,
  AVANTAGES,
  PRIX_PRO
};