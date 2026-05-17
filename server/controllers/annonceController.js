const Annonce = require('../models/Annonce');

// ─── Créer une annonce ───
// POST /api/annonces
const createAnnonce = async (req, res) => {
  try {
    const {
      titre, description, categorie, sousCategorie,
      type, prix, photos, video_annonce,
      detailsSupplementaires, localisation
    } = req.body;

    if (!titre || !description || !categorie) {
      return res.status(400).json({ message: 'Titre, description et catégorie sont obligatoires.' });
    }

    // Vérifier le nombre d'annonces gratuites (à implémenter plus tard avec vérification abonnement)
    // Pour l'instant, on laisse créer

    // Calculer la date d'expiration (gratuit = 15 jours par défaut)
    const dateExpiration = new Date();
    dateExpiration.setDate(dateExpiration.getDate() + 15);

    const annonce = await Annonce.create({
      createur: req.user._id,
      titre,
      description,
      categorie,
      sousCategorie: sousCategorie || '',
      type: type || 'service',
      prix: {
        montant: prix?.montant || 0,
        estNegociable: prix?.estNegociable !== undefined ? prix.estNegociable : true,
        estGratuit: prix?.estGratuit || false
      },
      photos: photos || [],
      video_annonce: video_annonce || null,
      detailsSupplementaires: detailsSupplementaires || {},
      localisation: localisation || {},
      dateExpiration
    });

    res.status(201).json(annonce);

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Lister toutes les annonces actives ───
// GET /api/annonces
const getAnnonces = async (req, res) => {
  try {
    const { categorie, ville, type, page = 1, limite = 20 } = req.query;

    const filtre = { statut: 'actif' };

    if (categorie) filtre.categorie = categorie;
    if (type) filtre.type = type;
    if (ville) filtre['localisation.ville'] = { $regex: ville, $options: 'i' };

    const skip = (page - 1) * limite;

    const annonces = await Annonce.find(filtre)
      .populate('createur', 'nom prenom photo telephone')
      .sort({ estMiseEnAvant: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limite));

    const total = await Annonce.countDocuments(filtre);

    res.json({
      annonces,
      page: parseInt(page),
      pages: Math.ceil(total / limite),
      total
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Détail d'une annonce ───
// GET /api/annonces/:id
const getAnnonceById = async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id)
      .populate('createur', 'nom prenom photo telephone localisation');

    if (!annonce) {
      return res.status(404).json({ message: 'Annonce non trouvée.' });
    }

    // Incrémenter le compteur de vues
    annonce.nombreVues += 1;
    await annonce.save();

    res.json(annonce);

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Modifier une annonce ───
// PUT /api/annonces/:id
const updateAnnonce = async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);

    if (!annonce) {
      return res.status(404).json({ message: 'Annonce non trouvée.' });
    }

    // Vérifier que l'utilisateur est le créateur
    if (annonce.createur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres annonces.' });
    }

    const champsModifiables = [
      'titre', 'description', 'categorie', 'sousCategorie',
      'type', 'prix', 'photos', 'video_annonce',
      'detailsSupplementaires', 'localisation'
    ];

    champsModifiables.forEach(champ => {
      if (req.body[champ] !== undefined) {
        annonce[champ] = req.body[champ];
      }
    });

    const updated = await annonce.save();
    res.json(updated);

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Supprimer une annonce ───
// DELETE /api/annonces/:id
const deleteAnnonce = async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);

    if (!annonce) {
      return res.status(404).json({ message: 'Annonce non trouvée.' });
    }

    if (annonce.createur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres annonces.' });
    }

    await annonce.deleteOne();
    res.json({ message: 'Annonce supprimée avec succès.' });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Mes annonces ───
// GET /api/annonces/mes-annonces
const getMesAnnonces = async (req, res) => {
  try {
    const annonces = await Annonce.find({ createur: req.user._id })
      .sort({ createdAt: -1 });

    res.json(annonces);

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = {
  createAnnonce,
  getAnnonces,
  getAnnonceById,
  updateAnnonce,
  deleteAnnonce,
  getMesAnnonces
};