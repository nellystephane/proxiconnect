const mongoose = require('mongoose');

// Catégories disponibles
const CATEGORIES = [
  'Électricité',
  'Plomberie',
  'Maçonnerie',
  'Peinture',
  'Menuiserie',
  'Couture',
  'Coiffure',
  'Esthétique',
  'Cours particuliers',
  'Informatique',
  'Agriculture',
  'Vente de produits',
  'Location',
  'Transport',
  'Autre'
];

const annonceSchema = new mongoose.Schema({

  // ─── Créateur ───
  createur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ─── Infos générales ───
  titre: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  categorie: {
    type: String,
    required: true,
    trim: true
  },
  sousCategorie: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['service', 'vente', 'autre'],
    default: 'service'
  },

  // ─── Prix ───
  prix: {
    montant: { type: Number, default: 0 },
    estNegociable: { type: Boolean, default: true },
    estGratuit: { type: Boolean, default: false }
  },

  // ─── Médias ───
  photos: {
    type: [String],
    validate: [arrayLimit, 'Maximum 6 photos autorisées']
  },
  video: {
    type: String,
    default: null
  },

  // ─── Détails supplémentaires selon catégorie ───
  detailsSupplementaires: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // ─── Localisation ───
  localisation: {
    pays: { type: String, trim: true },
    ville: { type: String, trim: true },
    quartier: { type: String, trim: true },
    details: { type: String, trim: true }
  },

  // ─── Statut ───
  statut: {
    type: String,
    enum: ['actif', 'expiré', 'désactivé'],
    default: 'actif'
  },

  // ─── Visibilité ───
  estMiseEnAvant: {
    type: Boolean,
    default: false
  },
  estPremium: {
    type: Boolean,
    default: false
  },

  // ─── Dates ───
  dateExpiration: {
    type: Date,
    required: true
  },

  // ─── Stats ───
  nombreVues: {
    type: Number,
    default: 0
  },
  nombreFavoris: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});

// Validation : max 6 photos
function arrayLimit(val) {
  return val.length <= 6;
}

// Index pour les recherches
annonceSchema.index({ categorie: 1, statut: 1 });
annonceSchema.index({ createur: 1 });
annonceSchema.index({ 'localisation.ville': 1 });
annonceSchema.index({ titre: 'text', description: 'text' });

module.exports = mongoose.model('Annonce', annonceSchema);
module.exports.CATEGORIES = CATEGORIES;
