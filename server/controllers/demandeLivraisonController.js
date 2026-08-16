const DemandeLivraison = require('../models/DemandeLivraison');
const Commande = require('../models/Commande');
const CommandeRestaurant = require('../models/CommandeRestaurant');
const Livreur = require('../models/Livreur');
const EvaluationLivreur = require('../models/EvaluationLivreur');
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

    // ─── Prévient les livreurs déjà en ligne dont la zone couverte
    // correspond à la ville de livraison — sans casser le fonctionnement
    // existant (les livreurs continuent aussi de voir la demande en
    // consultant l'onglet "Demandes" à tout moment). Best-effort : un souci
    // de notification ne doit jamais faire échouer la création de la demande. ───
    try {
      const ville = demande.adresseLivraison?.ville;
      if (ville) {
        const livreursEnZone = await Livreur.find({
          statut: 'active',
          disponibilite: 'en_ligne',
          zoneCouverture: new RegExp(ville, 'i')
        }).select('utilisateur');

        const io = req.app.get('io');
        for (const l of livreursEnZone) {
          await creerNotification(
            io,
            l.utilisateur,
            'nouvelle_livraison',
            'Nouvelle livraison disponible',
            `Une livraison est disponible à ${ville}.`,
            '/livraison'
          );
        }
      }
    } catch (notifError) {
      console.error('Notification livreurs zone échouée :', notifError.message);
    }

    res.status(201).json(demande);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
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
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
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
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Mettre à jour le statut (livreur assigné uniquement) ───
// PUT /api/demandes-livraison/:id/statut
const updateStatutDemande = async (req, res) => {
  try {
    const { statut } = req.body;
    const statutsValides = ['en_cours', 'en_route', 'arrivée', 'livrée', 'annulée'];
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

    const MESSAGES_STATUT = {
      en_cours: 'Votre livreur a démarré la course.',
      en_route: 'Votre livreur est en route.',
      arrivée: 'Votre livreur est arrivé.',
      livrée: 'Votre commande a été livrée.'
    };
    if (MESSAGES_STATUT[statut]) {
      await creerNotification(
        req.app.get('io'),
        demande.client,
        'statut_livraison',
        statut === 'livrée' ? 'Livraison terminée' : 'Livraison en cours',
        MESSAGES_STATUT[statut],
        '/profil'
      );
    }
    // ─── Une fois livrée, on invite le client à évaluer le livreur ───
    if (statut === 'livrée') {
      await creerNotification(
        req.app.get('io'),
        demande.client,
        'demande_evaluation',
        'Comment s\'est passée votre livraison ?',
        'Notez votre livreur en quelques secondes.',
        `/livraison/${demande._id}/evaluer`
      );
    }

    res.json(demande);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Historique des livraisons du livreur connecté ───
// GET /api/demandes-livraison/mes-livraisons
const getMesLivraisons = async (req, res) => {
  try {
    const demandes = await DemandeLivraison.find({ livreur: req.user._id })
      .populate('vendeur', 'nom prenom telephone')
      .sort({ createdAt: -1 });

    // ─── Rattache l'évaluation du client à chaque livraison, quand elle
    // existe déjà (visible directement dans l'historique du livreur, pas
    // seulement agrégée dans sa note moyenne). ───
    const evaluations = await EvaluationLivreur.find({ livraison: { $in: demandes.map((d) => d._id) } })
      .select('livraison note commentaire createdAt');
    const evaluationParLivraison = new Map(evaluations.map((e) => [e.livraison.toString(), e]));

    const demandesAvecEvaluation = demandes.map((d) => ({
      ...d.toObject(),
      evaluation: evaluationParLivraison.get(d._id.toString()) || null
    }));

    res.json(demandesAvecEvaluation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
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
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
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
