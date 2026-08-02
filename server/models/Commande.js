const mongoose = require('mongoose');

// ─── Commande (Espace Vente) ───
const commandeSchema = new mongoose.Schema({

  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  boutique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boutique',
    required: true
  },

  articles: [{
    produit: { type: mongoose.Schema.Types.ObjectId, ref: 'Produit', required: true },
    nom: { type: String, required: true },       // recopié au moment de la commande
    prixUnitaire: { type: Number, required: true }, // recopié au moment de la commande
    quantite: { type: Number, required: true, min: 1 },
    varianteChoisie: { type: String, default: '' }
  }],

  montantTotal: {
    type: Number,
    required: true
  },

  livraisonDemandee: {
    type: Boolean,
    default: false
  },

  statut: {
    type: String,
    enum: ['en_attente', 'confirmée', 'expédiée', 'livrée', 'annulée'],
    default: 'en_attente'
  },

  adresseLivraison: {
    ville: { type: String, trim: true },
    quartier: { type: String, trim: true },
    details: { type: String, trim: true }
  },

  note: {
    type: String,
    trim: true,
    maxlength: 300,
    default: ''
  }

}, {
  timestamps: true
});

commandeSchema.index({ client: 1 });
commandeSchema.index({ vendeur: 1 });
commandeSchema.index({ boutique: 1, statut: 1 });

module.exports = mongoose.model('Commande', commandeSchema);
