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
    details: { type: String, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    mapUrl: { type: String, trim: true, default: '' },
    formattedAddress: { type: String, trim: true, default: '' }
  },

  tarif: { type: Number, default: 0, min: 0 },

  // ─── Statuts enrichis : les anciennes valeurs ('en_attente', 'assignée',
  // 'en_cours', 'livrée', 'annulée') restent toutes valides et inchangées
  // dans leur sens — on ajoute seulement 'en_route' et 'arrivée' entre
  // 'assignée' et 'livrée' pour un suivi plus fin, sans renommer ni
  // supprimer aucun statut existant (aucune donnée en base à migrer).
  statut: {
    type: String,
    enum: ['en_attente', 'assignée', 'en_cours', 'en_route', 'arrivée', 'livrée', 'annulée'],
    default: 'en_attente'
  }

}, {
  timestamps: true
});

demandeLivraisonSchema.index({ statut: 1 });
demandeLivraisonSchema.index({ livreur: 1 });
demandeLivraisonSchema.index({ vendeur: 1 });

module.exports = mongoose.model('DemandeLivraison', demandeLivraisonSchema);
