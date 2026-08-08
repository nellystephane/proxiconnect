const mongoose = require('mongoose');

const TYPES_NOTIFICATION = [
  'nouveau_message',
  'piece_jointe',
  'nouvelle_commande',
  'statut_commande',
  'nouvelle_reservation',
  'statut_reservation',
  'demande_livraison_acceptee',
  'statut_livraison',
  'nouvel_avis',
  'paiement_confirme',
  'demande_evaluation',
  'nouvelle_evaluation_livreur'
];

// ─── Notification ───
const notificationSchema = new mongoose.Schema({

  destinataire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  type: { type: String, enum: TYPES_NOTIFICATION, required: true },
  titre: { type: String, required: true, trim: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 300 },

  // ─── Lien vers la page concernée côté client (ex: /messages/123, /vente) ───
  lien: { type: String, default: '' },

  lu: { type: Boolean, default: false }

}, {
  timestamps: true
});

notificationSchema.index({ destinataire: 1, createdAt: -1 });
notificationSchema.index({ destinataire: 1, lu: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.TYPES_NOTIFICATION = TYPES_NOTIFICATION;
