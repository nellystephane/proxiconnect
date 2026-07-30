const User = require('../models/User');
const Annonce = require('../models/Annonce');
const Avis = require('../models/Avis');
const Paiement = require('../models/Paiement');
const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────────────────
//  DASHBOARD – Statistiques générales
// ─────────────────────────────────────────────────────

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalAnnonces,
      totalAvis,
      totalPaiements,
      annoncesActives,
      annoncesExpirees,
      utilisateursBannis,
      abonnementsActifs,
      paiementsConfirmes,
      chiffreAffaires
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Annonce.countDocuments(),
      Avis.countDocuments(),
      Paiement.countDocuments(),
      Annonce.countDocuments({ statut: 'actif' }),
      Annonce.countDocuments({ statut: 'expiré' }),
      User.countDocuments({ estBanni: true }),
      Paiement.countDocuments({
        statut: 'confirmé',
        $or: [
          { dateFin: { $gt: new Date() } },
          { dateFin: null }
        ]
      }),
      Paiement.countDocuments({ statut: 'confirmé' }),
      Paiement.aggregate([
        { $match: { statut: 'confirmé' } },
        { $group: { _id: null, total: { $sum: '$montant' } } }
      ])
    ]);

    // Évolution des inscriptions (30 derniers jours)
    const trenteJours = new Date();
    trenteJours.setDate(trenteJours.getDate() - 30);

    const inscriptionsRecentes = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: trenteJours }
    });

    // Top catégories
    const topCategories = await Annonce.aggregate([
      { $match: { statut: 'actif' } },
      { $group: { _id: '$categorie', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Dernières inscriptions
    const derniersUtilisateurs = await User.find({ role: 'user' })
      .select('nom prenom email createdAt estVerifie estBanni')
      .sort({ createdAt: -1 })
      .limit(10);

    // Dernières annonces
    const dernieresAnnonces = await Annonce.find()
      .populate('createur', 'nom prenom email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats: {
        totalUsers,
        totalAnnonces,
        totalAvis,
        totalPaiements,
        annoncesActives,
        annoncesExpirees,
        utilisateursBannis,
        abonnementsActifs,
        paiementsConfirmes,
        chiffreAffaires: chiffreAffaires[0]?.total || 0,
        inscriptionsRecentes
      },
      topCategories,
      derniersUtilisateurs,
      dernieresAnnonces
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────
//  UTILISATEURS – Gestion complète
// ─────────────────────────────────────────────────────

// GET /api/admin/users?page=1&limite=20&q=&bannis=
const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limite = Math.min(50, Math.max(1, parseInt(req.query.limite) || 20));
    const skip = (page - 1) * limite;
    const { q, bannis, verified } = req.query;

    const filtre = { role: 'user' };

    if (q) {
      filtre.$or = [
        { nom: { $regex: q, $options: 'i' } },
        { prenom: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { telephone: { $regex: q, $options: 'i' } }
      ];
    }

    if (bannis === 'true') filtre.estBanni = true;
    if (bannis === 'false') filtre.estBanni = false;
    if (verified === 'true') filtre.estVerifie = true;
    if (verified === 'false') filtre.estVerifie = false;

    const [users, total] = await Promise.all([
      User.find(filtre)
        .select('-motDePasse')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limite),
      User.countDocuments(filtre)
    ]);

    res.json({
      users,
      page,
      pages: Math.ceil(total / limite),
      total
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-motDePasse');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    const [annonces, avisRecus, avisDonnes, paiements] = await Promise.all([
      Annonce.find({ createur: user._id }).sort({ createdAt: -1 }),
      Avis.find({ concerne: user._id }).populate('auteur', 'nom prenom photo').populate('annonce', 'titre'),
      Avis.find({ auteur: user._id }).populate('concerne', 'nom prenom photo').populate('annonce', 'titre'),
      Paiement.find({ utilisateur: user._id }).sort({ createdAt: -1 })
    ]);

    res.json({
      user,
      annonces,
      avisRecus,
      avisDonnes,
      paiements
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// PUT /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const { nom, prenom, email, telephone, estVerifie, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    if (nom !== undefined) user.nom = nom;
    if (prenom !== undefined) user.prenom = prenom;
    if (email !== undefined) user.email = email;
    if (telephone !== undefined) user.telephone = telephone;
    if (estVerifie !== undefined) user.estVerifie = estVerifie;
    if (role !== undefined && role === 'admin') {
      // Seul un admin peut promouvoir un autre admin
      user.role = role;
    }

    await user.save();

    res.json({
      message: 'Utilisateur mis à jour avec succès.',
      user: {
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        estVerifie: user.estVerifie,
        role: user.role,
        estBanni: user.estBanni
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// PUT /api/admin/users/:id/ban
const banUser = async (req, res) => {
  try {
    const { motif } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Empêcher le bannissement d'un autre admin
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Impossible de bannir un administrateur.' });
    }

    user.estBanni = !user.estBanni;
    user.motifBannissement = user.estBanni ? (motif || 'Non spécifié') : '';

    // Si banni, désactiver toutes ses annonces actives
    if (user.estBanni) {
      await Annonce.updateMany(
        { createur: user._id, statut: 'actif' },
        { statut: 'désactivé' }
      );
    }

    await user.save();

    res.json({
      message: user.estBanni ? 'Utilisateur banni avec succès.' : 'Utilisateur réactivé avec succès.',
      estBanni: user.estBanni,
      motifBannissement: user.motifBannissement
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Impossible de supprimer un administrateur.' });
    }

    // Supprimer toutes les données associées
    await Promise.all([
      Annonce.deleteMany({ createur: user._id }),
      Avis.deleteMany({ auteur: user._id }),
      Avis.deleteMany({ concerne: user._id }),
      Paiement.deleteMany({ utilisateur: user._id }),
      User.findByIdAndDelete(user._id)
    ]);

    res.json({ message: 'Utilisateur et toutes ses données supprimés avec succès.' });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────
//  ANNONCES – Modération
// ─────────────────────────────────────────────────────

// GET /api/admin/annonces?page=1&limite=20&statut=&q=
const getAnnonces = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limite = Math.min(50, Math.max(1, parseInt(req.query.limite) || 20));
    const skip = (page - 1) * limite;
    const { statut, q } = req.query;

    const filtre = {};
    if (statut) filtre.statut = statut;
    if (q) filtre.$or = [
      { titre: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];

    const [annonces, total] = await Promise.all([
      Annonce.find(filtre)
        .populate('createur', 'nom prenom email telephone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limite),
      Annonce.countDocuments(filtre)
    ]);

    res.json({ annonces, page, pages: Math.ceil(total / limite), total });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// PUT /api/admin/annonces/:id/statut
const updateAnnonceStatut = async (req, res) => {
  try {
    const { statut } = req.body;

    if (!['actif', 'expiré', 'désactivé'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    const annonce = await Annonce.findByIdAndUpdate(
      req.params.id,
      { statut },
      { new: true }
    ).populate('createur', 'nom prenom email');

    if (!annonce) {
      return res.status(404).json({ message: 'Annonce non trouvée.' });
    }

    res.json({ message: 'Statut de l\'annonce mis à jour.', annonce });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// DELETE /api/admin/annonces/:id
const deleteAnnonce = async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce) {
      return res.status(404).json({ message: 'Annonce non trouvée.' });
    }

    // Retirer des favoris
    await User.updateMany(
      { favoris: annonce._id },
      { $pull: { favoris: annonce._id } }
    );

    await annonce.deleteOne();

    res.json({ message: 'Annonce supprimée avec succès.' });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────
//  AVIS – Modération
// ─────────────────────────────────────────────────────

// GET /api/admin/avis?page=1&limite=20&signales=
const getAvis = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limite = Math.min(50, Math.max(1, parseInt(req.query.limite) || 20));
    const skip = (page - 1) * limite;
    const { signales, masques } = req.query;

    const filtre = {};
    if (signales === 'true') filtre.signalements = { $gte: 1 };
    if (masques === 'true') filtre.estMasque = true;
    if (masques === 'false') filtre.estMasque = false;

    const [avis, total] = await Promise.all([
      Avis.find(filtre)
        .populate('auteur', 'nom prenom email')
        .populate('concerne', 'nom prenom email')
        .populate('annonce', 'titre')
        .sort({ signalements: -1, createdAt: -1 })
        .skip(skip)
        .limit(limite),
      Avis.countDocuments(filtre)
    ]);

    res.json({ avis, page, pages: Math.ceil(total / limite), total });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// PUT /api/admin/avis/:id/masquer
const masquerAvis = async (req, res) => {
  try {
    const avis = await Avis.findById(req.params.id);
    if (!avis) {
      return res.status(404).json({ message: 'Avis non trouvé.' });
    }

    avis.estMasque = !avis.estMasque;
    await avis.save();

    res.json({
      message: avis.estMasque ? 'Avis masqué.' : 'Avis réaffiché.',
      estMasque: avis.estMasque
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// DELETE /api/admin/avis/:id
const deleteAvis = async (req, res) => {
  try {
    const avis = await Avis.findByIdAndDelete(req.params.id);
    if (!avis) {
      return res.status(404).json({ message: 'Avis non trouvé.' });
    }

    res.json({ message: 'Avis supprimé avec succès.' });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────
//  PAIEMENTS – Gestion
// ─────────────────────────────────────────────────────

// GET /api/admin/paiements?page=1&limite=20&statut=
const getPaiements = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limite = Math.min(50, Math.max(1, parseInt(req.query.limite) || 20));
    const skip = (page - 1) * limite;
    const { statut } = req.query;

    const filtre = {};
    if (statut) filtre.statut = statut;

    const [paiements, total] = await Promise.all([
      Paiement.find(filtre)
        .populate('utilisateur', 'nom prenom email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limite),
      Paiement.countDocuments(filtre)
    ]);

    res.json({ paiements, page, pages: Math.ceil(total / limite), total });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────
//  CRÉATION DU PREMIER ADMIN (seed automatique)
// ─────────────────────────────────────────────────────

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@proxiconnect.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

    const adminExists = await User.findOne({ email: adminEmail });
    if (adminExists) {
      // S'assurer que l'admin a bien le rôle admin
      if (adminExists.role !== 'admin') {
        adminExists.role = 'admin';
        await adminExists.save();
        console.log('👑 Rôle admin attribué à', adminEmail);
      }
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await User.create({
      nom: 'Admin',
      prenom: 'ProxiConnect',
      email: adminEmail,
      motDePasse: hashedPassword,
      telephone: '+229 00 00 00 00',
      role: 'admin',
      estVerifie: true,
      localisation: {
        pays: 'Bénin',
        ville: 'Cotonou'
      }
    });

    console.log('✅ Compte admin créé :');
    console.log(`   Email   : ${adminEmail}`);
    console.log(`   Mot de passe : ${adminPassword}`);
    console.log('   ⚠ CHANGEZ CES IDENTIFIANTS EN PRODUCTION !');
  } catch (error) {
    console.error('❌ Erreur lors de la création du compte admin :', error.message);
  }
};

module.exports = {
  getDashboard,
  getUsers,
  getUserById,
  updateUser,
  banUser,
  deleteUser,
  getAnnonces,
  updateAnnonceStatut,
  deleteAnnonce,
  getAvis,
  masquerAvis,
  deleteAvis,
  getPaiements,
  seedAdmin
};

