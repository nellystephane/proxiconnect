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
    // "details" sert de description humaine du lieu ("dernière maison à
    // gauche dans la von de l'école...") — champ déjà existant, désormais
    // rendu obligatoire côté contrôleur pour toute NOUVELLE commande avec
    // livraison, sans jamais invalider les anciennes commandes qui ne
    // l'avaient pas renseigné.
    details: { type: String, trim: true },
    // ─── Localisation GPS : toujours optionnelle (priorité au contexte
    // ouest-africain, où la description du lieu prime sur les coordonnées). ───
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    mapUrl: { type: String, trim: true, default: '' },
    formattedAddress: { type: String, trim: true, default: '' }
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
