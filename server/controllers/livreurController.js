const Livreur = require('../models/Livreur');

// ─── Devenir livreur (créer son profil) ───
// POST /api/livreurs
const createLivreur = async (req, res) => {
  try {
    const existant = await Livreur.findOne({ utilisateur: req.user._id });
    if (existant) {
      return res.status(409).json({ message: 'Vous avez déjà un profil livreur.' });
    }

    const { zoneCouverture, moyenTransport, tarifBase } = req.body;

    const livreur = await Livreur.create({
      utilisateur: req.user._id,
      zoneCouverture: zoneCouverture || [],
      moyenTransport: moyenTransport || 'moto',
      tarifBase: tarifBase ?? 500
    });

    res.status(201).json(livreur);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Mon profil livreur ───
// GET /api/livreurs/moi
const getMonProfil = async (req, res) => {
  try {
    const livreur = await Livreur.findOne({ utilisateur: req.user._id });
    if (!livreur) return res.status(404).json({ message: "Vous n'avez pas encore de profil livreur." });
    res.json(livreur);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Modifier mon profil / basculer en ligne-hors ligne ───
// PUT /api/livreurs/moi
const updateMonProfil = async (req, res) => {
  try {
    const livreur = await Livreur.findOne({ utilisateur: req.user._id });
    if (!livreur) return res.status(404).json({ message: "Vous n'avez pas encore de profil livreur." });

    const champsAutorises = ['zoneCouverture', 'moyenTransport', 'tarifBase', 'disponibilite'];
    champsAutorises.forEach((champ) => {
      if (req.body[champ] !== undefined) livreur[champ] = req.body[champ];
    });

    await livreur.save();
    res.json(livreur);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Annuaire des livreurs disponibles ───
// GET /api/livreurs?ville=
const getLivreurs = async (req, res) => {
  try {
    const { ville } = req.query;
    const filtre = { statut: 'active', disponibilite: 'en_ligne' };
    if (ville) filtre.zoneCouverture = new RegExp(ville, 'i');

    const livreurs = await Livreur.find(filtre)
      .populate('utilisateur', 'nom prenom photo telephone localisation')
      .sort({ 'abonnementPro.actif': -1, createdAt: -1 });

    res.json(livreurs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Profil public d'un livreur ───
// GET /api/livreurs/:id
const getLivreurPublic = async (req, res) => {
  try {
    const livreur = await Livreur.findById(req.params.id)
      .populate('utilisateur', 'nom prenom photo telephone localisation');
    if (!livreur) return res.status(404).json({ message: 'Livreur introuvable.' });
    res.json(livreur);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { createLivreur, getMonProfil, updateMonProfil, getLivreurs, getLivreurPublic };
