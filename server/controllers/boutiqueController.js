const Boutique = require('../models/Boutique');
const Produit = require('../models/Produit');

// ─── Créer sa boutique (une seule par utilisateur) ───
// POST /api/boutiques
const createBoutique = async (req, res) => {
  try {
    const existante = await Boutique.findOne({ proprietaire: req.user._id });
    if (existante) {
      return res.status(409).json({ message: 'Vous avez déjà une boutique.', boutiqueId: existante._id });
    }

    const { nom, description, logo, banniere, couleurPrincipale, localisation } = req.body;

    if (!nom || !nom.trim()) {
      return res.status(400).json({ message: 'Le nom de la boutique est obligatoire.' });
    }

    const boutique = await Boutique.create({
      proprietaire: req.user._id,
      nom: nom.trim(),
      description: description || '',
      logo: logo || '',
      banniere: banniere || '',
      couleurPrincipale: couleurPrincipale || '#007AFF',
      localisation: localisation || {}
    });

    res.status(201).json(boutique);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Ma boutique (avec ses produits) ───
// GET /api/boutiques/moi
const getMaBoutique = async (req, res) => {
  try {
    const boutique = await Boutique.findOne({ proprietaire: req.user._id });
    if (!boutique) {
      return res.status(404).json({ message: "Vous n'avez pas encore de boutique." });
    }
    const produits = await Produit.find({ boutique: boutique._id }).sort({ createdAt: -1 });
    res.json({ boutique, produits });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Boutique publique (vitrine) ───
// GET /api/boutiques/:id
const getBoutiquePublique = async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id)
      .populate('proprietaire', 'nom prenom photo telephone localisation');

    if (!boutique || boutique.statut !== 'active') {
      return res.status(404).json({ message: 'Boutique introuvable.' });
    }

    const produits = await Produit.find({ boutique: boutique._id, statut: { $ne: 'archive' } })
      .sort({ estMisEnAvant: -1, createdAt: -1 });

    res.json({ boutique, produits });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Modifier sa boutique ───
// PUT /api/boutiques/moi
const updateBoutique = async (req, res) => {
  try {
    const boutique = await Boutique.findOne({ proprietaire: req.user._id });
    if (!boutique) {
      return res.status(404).json({ message: "Vous n'avez pas encore de boutique." });
    }

    const champsAutorises = ['nom', 'description', 'logo', 'banniere', 'couleurPrincipale', 'localisation'];
    champsAutorises.forEach((champ) => {
      if (req.body[champ] !== undefined) boutique[champ] = req.body[champ];
    });

    await boutique.save();
    res.json(boutique);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Annuaire des boutiques (public) ───
// GET /api/boutiques?ville=&recherche=&page=&limite=
const getBoutiques = async (req, res) => {
  try {
    const { ville, recherche, page = 1, limite = 20 } = req.query;
    const pageNormalisee = Math.max(1, parseInt(page) || 1);
    const limiteNormalisee = Math.min(50, Math.max(1, parseInt(limite) || 20));

    const filtre = { statut: 'active' };
    if (ville) filtre['localisation.ville'] = new RegExp(ville, 'i');
    if (recherche) filtre.$text = { $search: recherche };

    const [boutiques, total] = await Promise.all([
      Boutique.find(filtre)
        .sort({ 'abonnementPro.actif': -1, createdAt: -1 })
        .skip((pageNormalisee - 1) * limiteNormalisee)
        .limit(limiteNormalisee),
      Boutique.countDocuments(filtre)
    ]);

    res.json({ boutiques, page: pageNormalisee, pages: Math.ceil(total / limiteNormalisee) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  createBoutique,
  getMaBoutique,
  getBoutiquePublique,
  getBoutiques,
  updateBoutique
};
