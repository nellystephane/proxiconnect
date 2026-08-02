const mongoose = require('mongoose');

// ─── Demande de livraison (Espace Livraison) ───
// Rattachée à une commande de l'espace Vente ou Restauration (référence polymorphe).
const demandeLivraisonSchema = new mongoose.Schema({

  sourceType: { type: String, enum: ['vente', 'restauration'], required: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'sourceModel' },
  sourceModel: { type: String, required: true, enum: ['Commande', 'CommandeRestaurant'] },

  vendeur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  livreur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  adresseRecuperation: {
    ville: { type: String, trim: true },
    quartier: { type: String, trim: true },
    details: { type: String, trim: true }
  },
  adresseLivraison: {
    ville: { type: String, trim: true },
    quartier: { type: String, trim: true },
    details: { type: String, trim: true }
  },

  tarif: { type: Number, default: 0, min: 0 },

  statut: {
    type: String,
    enum: ['en_attente', 'assignée', 'en_cours', 'livrée', 'annulée'],
    default: 'en_attente'
  }

}, {
  timestamps: true
});

demandeLivraisonSchema.index({ statut: 1 });
demandeLivraisonSchema.index({ livreur: 1 });
demandeLivraisonSchema.index({ vendeur: 1 });

module.exports = mongoose.model('DemandeLivraison', demandeLivraisonSchema);
