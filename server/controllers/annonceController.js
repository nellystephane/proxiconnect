const Annonce = require('../models/Annonce');
const User = require('../models/User');
const { getAvantagesActifs } = require('../utils/abonnement');

// ─── Normalise page/limite pour éviter des valeurs invalides ou abusives ───
// (ex: ?limite=999999 forcerait un scan massif de la collection)
const normaliserPagination = (page, limite) => {
  const pageNormalisee = Math.max(1, parseInt(page) || 1);
  const limiteNormalisee = Math.min(50, Math.max(1, parseInt(limite) || 20));
  return { page: pageNormalisee, limite: limiteNormalisee };
};

// ─── Marquer comme expirées les annonces dont la date est dépassée ───
// Appelé au fil de l'eau (pas de tâche planifiée nécessaire pour ce volume)
const marquerAnnoncesExpirees = async (filtre = {}) => {
  await Annonce.updateMany(
    { statut: 'actif', dateExpiration: { $lt: new Date() }, ...filtre },
    { statut: 'expiré' }
  );
};

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

    // ─── Vérifier les limites de l'abonnement ───
    const { avantages } = await getAvantagesActifs(req.user._id);

    const nombreAnnoncesActives = await Annonce.countDocuments({
      createur: req.user._id,
      statut: 'actif'
    });

    if (nombreAnnoncesActives >= avantages.nombreAnnonces) {
      return res.status(403).json({
        message: `Vous avez atteint la limite de ${avantages.nombreAnnonces} annonce(s) active(s) de votre offre. Passez à un abonnement supérieur pour en publier davantage.`,
        code: 'LIMITE_ANNONCES_ATTEINTE'
      });
    }

    if (video_annonce && !avantages.videoAutorisee) {
      return res.status(403).json({
        message: 'L\'ajout d\'une vidéo est réservé aux membres abonnés.',
        code: 'VIDEO_NON_AUTORISEE'
      });
    }

    // Date d'expiration selon la durée de vie de l'offre active
    const dateExpiration = new Date();
    dateExpiration.setDate(dateExpiration.getDate() + avantages.dureeAnnonce);

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
      video_annonce: avantages.videoAutorisee ? (video_annonce || null) : null,
      detailsSupplementaires: detailsSupplementaires || {},
      localisation: localisation || {},
      estMiseEnAvant: avantages.miseEnAvant,
      estPremium: avantages.miseEnAvant || avantages.videoAutorisee,
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
    const { categorie, ville, type, q, prixMin, prixMax, tri } = req.query;
    const { page, limite } = normaliserPagination(req.query.page, req.query.limite);

    await marquerAnnoncesExpirees();

    const filtre = { statut: 'actif' };

    if (categorie) filtre.categorie = categorie;
    if (type) filtre.type = type;
    if (ville) filtre['localisation.ville'] = { $regex: ville, $options: 'i' };
    if (q) filtre.$text = { $search: q };
    if (prixMin || prixMax) {
      filtre['prix.montant'] = {};
      if (prixMin) filtre['prix.montant'].$gte = Number(prixMin);
      if (prixMax) filtre['prix.montant'].$lte = Number(prixMax);
    }

    const tris = {
      recent: { estMiseEnAvant: -1, createdAt: -1 },
      prix_asc: { 'prix.montant': 1, createdAt: -1 },
      prix_desc: { 'prix.montant': -1, createdAt: -1 }
    };
    const triApplique = tris[tri] || tris.recent;

    const skip = (page - 1) * limite;

    const annonces = await Annonce.find(filtre)
      .populate('createur', 'nom prenom photo telephone')
      .sort(triApplique)
      .skip(skip)
      .limit(limite);

    const total = await Annonce.countDocuments(filtre);

    res.json({
      annonces,
      page,
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
      .populate('createur', 'nom prenom photo telephone localisation createdAt');

    if (!annonce) {
      return res.status(404).json({ message: 'Annonce non trouvée.' });
    }

    // Incrémenter le compteur de vues, sauf quand le créateur consulte sa
    // propre annonce (ça ne devrait pas gonfler ses propres stats).
    // req.user est optionnel ici : cette route est publique, l'utilisateur
    // n'est identifié que s'il a fourni un token valide (voir routes).
    const estLeCreateur = req.user && annonce.createur._id.toString() === req.user._id.toString();
    if (!estLeCreateur) {
      annonce.nombreVues += 1;
      await annonce.save();
    }

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

    const { avantages } = await getAvantagesActifs(req.user._id);
    if (req.body.video_annonce && !avantages.videoAutorisee) {
      return res.status(403).json({ message: 'L\'ajout d\'une vidéo est réservé aux membres abonnés.' });
    }

    const champsModifiables = [
      'titre', 'description', 'categorie', 'sousCategorie',
      'type', 'prix', 'photos', 'video_annonce',
      'detailsSupplementaires', 'localisation', 'statut'
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

    // Retirer l'annonce des favoris des autres utilisateurs
    await User.updateMany({ favoris: annonce._id }, { $pull: { favoris: annonce._id } });

    res.json({ message: 'Annonce supprimée avec succès.' });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Mes annonces ───
// GET /api/annonces/mes-annonces
const getMesAnnonces = async (req, res) => {
  try {
    await marquerAnnoncesExpirees({ createur: req.user._id });

    const annonces = await Annonce.find({ createur: req.user._id })
      .sort({ createdAt: -1 });

    const { avantages } = await getAvantagesActifs(req.user._id);
    const nombreActives = annonces.filter(a => a.statut === 'actif').length;

    res.json({
      annonces,
      quota: {
        utilisees: nombreActives,
        autorisees: avantages.nombreAnnonces
      }
    });

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
