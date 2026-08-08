const mongoose = require('mongoose');

// ─── Conversation (Messagerie) ───
// Accessible à tous les utilisateurs connectés, sans limitation :
// client ↔ vendeur/restaurateur/hôtelier/prestataire/livreur, et
// livreur ↔ vendeur/restaurateur/client.
const conversationSchema = new mongoose.Schema({

  participants: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    required: true,
    validate: [(val) => val.length === 2, 'Une conversation relie exactement deux personnes.']
  },

  // ─── Contexte optionnel : d'où part la conversation (annonce, boutique, etc.) ───
  contexte: {
    type: { type: String, enum: ['annonce', 'produit', 'plat', 'chambre', 'livraison', null], default: null },
    id: { type: mongoose.Schema.Types.ObjectId, default: null },
    titre: { type: String, default: '' }
  },

  dernierMessage: { type: String, default: '' },
  derniereActivite: { type: Date, default: Date.now }

}, {
  timestamps: true
});

conversationSchema.index({ participants: 1 });
conversationSchema.index({ derniereActivite: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
