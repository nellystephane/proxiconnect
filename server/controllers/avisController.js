const Avis = require('../models/Avis');
const Annonce = require('../models/Annonce');
const mongoose = require('mongoose');

// ─── Donner un avis ───
// POST /api/avis
const createAvis = async (req, res) => {
  try {
    const { concerne, annonce, note, commentaire } = req.body;

    if (!concerne || !annonce || !note) {
      return res.status(400).json({ message: 'Destinataire, annonce et note sont obligatoires.' });
    }

    if (note < 1 || note > 5) {
      return res.status(400).json({ message: 'La note doit être entre 1 et 5.' });
    }

    // Vérifier que l'annonce existe
    const annonceExiste = await Annonce.findById(annonce);
    if (!annonceExiste) {
      return res.status(404).json({ message: 'Annonce non trouvée.' });
    }

    // Ne pas s'auto-évaluer
    if (req.user._id.toString() === concerne) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous évaluer vous-même.' });
    }

    // Vérifier si un avis existe déjà pour cette annonce par cet utilisateur
    const avisExistant = await Avis.findOne({
      auteur: req.user._id,
      annonce: annonce
    });

    if (avisExistant) {
      return res.status(400).json({ message: 'Vous avez déjà donné votre avis sur cette annonce.' });
    }

    const avis = await Avis.create({
      auteur: req.user._id,
      concerne,
      annonce,
      note,
      commentaire: commentaire || ''
    });

    // Peupler les références pour la réponse
    await avis.populate('auteur', 'nom prenom photo');
    await avis.populate('concerne', 'nom prenom photo');

    res.status(201).json(avis);

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Vous avez déjà donné votre avis sur cette annonce.' });
    }
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Avis reçus par un utilisateur ───
// GET /api/avis/utilisateur/:id
const getAvisByUser = async (req, res) => {
  try {
    const { page = 1, limite = 20 } = req.query;
    const skip = (page - 1) * limite;

    const avis = await Avis.find({
      concerne: req.params.id,
      estMasque: false
    })
      .populate('auteur', 'nom prenom photo')
      .populate('annonce', 'titre')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limite));

    // Calculer la moyenne
    const stats = await Avis.aggregate([
      { $match: { concerne: new mongoose.Types.ObjectId(req.params.id), estMasque: false } },
      { $group: { _id: null, moyenne: { $avg: '$note' }, total: { $sum: 1 } } }
    ]);

    const total = stats.length > 0 ? stats[0].total : 0;
    const moyenne = stats.length > 0 ? Math.round(stats[0].moyenne * 10) / 10 : 0;

    res.json({
      avis,
      stats: { moyenne, total },
      page: parseInt(page),
      pages: Math.ceil(total / limite)
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Avis donnés par l'utilisateur connecté ───
// GET /api/avis/mes-avis
const getMesAvis = async (req, res) => {
  try {
    const avis = await Avis.find({ auteur: req.user._id })
      .populate('concerne', 'nom prenom photo')
      .populate('annonce', 'titre')
      .sort({ createdAt: -1 });

    res.json(avis);

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Signaler un avis ───
// PUT /api/avis/:id/signaler
const signalerAvis = async (req, res) => {
  try {
    const avis = await Avis.findById(req.params.id);

    if (!avis) {
      return res.status(404).json({ message: 'Avis non trouvé.' });
    }

    avis.signalements += 1;

    // Si trop de signalements, masquer automatiquement
    if (avis.signalements >= 5) {
      avis.estMasque = true;
    }

    await avis.save();

    res.json({ message: 'Avis signalé.', signalements: avis.signalements });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { createAvis, getAvisByUser, getMesAvis, signalerAvis };