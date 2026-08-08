const mongoose = require('mongoose');

const MOYENS_TRANSPORT = ['moto', 'vélo', 'voiture', 'à pied'];

// ─── Profil livreur (Espace Livraison) ───
const livreurSchema = new mongoose.Schema({

  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  zoneCouverture: { type: [String], default: [] }, // villes/quartiers desservis
  moyenTransport: { type: String, enum: MOYENS_TRANSPORT, default: 'moto' },
  tarifBase: { type: Number, default: 500, min: 0 }, // XOF, tarif indicatif de départ

  disponibilite: { type: String, enum: ['en_ligne', 'hors_ligne'], default: 'hors_ligne' },

  statut: { type: String, enum: ['active', 'suspendu'], default: 'active' },

  abonnementPro: {
    actif: { type: Boolean, default: false },
    plan: { type: String, enum: ['pro_mensuel', 'pro_annuel', null], default: null },
    dateFin: { type: Date, default: null }
  }

}, {
  timestamps: true
});

livreurSchema.index({ utilisateur: 1 });
livreurSchema.index({ disponibilite: 1 });

module.exports = mongoose.model('Livreur', livreurSchema);
module.exports.MOYENS_TRANSPORT = MOYENS_TRANSPORT;
