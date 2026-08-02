const mongoose = require('mongoose');

// ─── Commande restaurant (Espace Restauration) ───
const commandeRestaurantSchema = new mongoose.Schema({

  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendeur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // propriétaire du restaurant
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },

  articles: [{
    plat: { type: mongoose.Schema.Types.ObjectId, ref: 'Plat', required: true },
    nom: { type: String, required: true },
    prixUnitaire: { type: Number, required: true },
    quantite: { type: Number, required: true, min: 1 }
  }],

  montantTotal: { type: Number, required: true },

  modeService: {
    type: String,
    enum: ['sur_place', 'a_emporter', 'livraison'],
    default: 'a_emporter'
  },

  statut: {
    type: String,
    enum: ['en_attente', 'en_préparation', 'prête', 'livrée', 'annulée'],
    default: 'en_attente'
  },

  adresseLivraison: {
    ville: { type: String, trim: true },
    quartier: { type: String, trim: true },
    details: { type: String, trim: true }
  },

  note: { type: String, trim: true, maxlength: 300, default: '' }

}, {
  timestamps: true
});

commandeRestaurantSchema.index({ client: 1 });
commandeRestaurantSchema.index({ vendeur: 1 });
commandeRestaurantSchema.index({ restaurant: 1, statut: 1 });

module.exports = mongoose.model('CommandeRestaurant', commandeRestaurantSchema);
