const mongoose = require('mongoose');

const CATEGORIES_PRODUIT = [
  'Vêtements',
  'Électronique',
  'Alimentation',
  'Beauté & Hygiène',
  'Maison & Décoration',
  'Chaussures',
  'Accessoires',
  'Autre'
];

// ─── Produit (Espace Vente) ───
const produitSchema = new mongoose.Schema({

  boutique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boutique',
    required: true
  },
  createur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  nom: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  categorie: {
    type: String,
    required: true,
    trim: true
  },

  prix: {
    type: Number,
    required: true,
    min: 0
  },
  quantiteDisponible: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },

  photos: {
    type: [String],
    validate: [(val) => val.length <= 6, 'Maximum 6 photos autorisées']
  },

  // ─── Variantes (taille, couleur, etc.) ───
  variantes: [{
    nom: { type: String, trim: true },   // ex: "Taille", "Couleur"
    valeurs: [{ type: String, trim: true }] // ex: ["S", "M", "L"]
  }],

  etat: {
    type: String,
    enum: ['neuf', 'occasion'],
    default: 'neuf'
  },
  marque: { type: String, trim: true, default: '' },
  modele: { type: String, trim: true, default: '' },
  livraisonPossible: {
    type: Boolean,
    default: true
  },

  estMisEnAvant: {
    type: Boolean,
    default: false
  },
  statut: {
    type: String,
    enum: ['disponible', 'rupture', 'archive'],
    default: 'disponible'
  },

  nombreVues: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});

produitSchema.index({ boutique: 1, statut: 1 });
produitSchema.index({ categorie: 1 });
produitSchema.index({ nom: 'text', description: 'text' });

module.exports = mongoose.model('Produit', produitSchema);
module.exports.CATEGORIES_PRODUIT = CATEGORIES_PRODUIT;
