const mongoose = require('mongoose');

const avisSchema = new mongoose.Schema({

  // ─── Qui donne l'avis ───
  auteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ─── Qui reçoit l'avis ───
  concerne: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ─── Annonce concernée ───
  annonce: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Annonce',
    required: true
  },

  // ─── Note ───
  note: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  // ─── Commentaire ───
  commentaire: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // ─── Signalement ───
  signalements: {
    type: Number,
    default: 0
  },
  estMasque: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

// Un utilisateur = un seul avis par annonce
avisSchema.index({ auteur: 1, annonce: 1 }, { unique: true });

// Pour afficher tous les avis d'un utilisateur
avisSchema.index({ concerne: 1 });

module.exports = mongoose.model('Avis', avisSchema);