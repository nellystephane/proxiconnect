const mongoose = require('mongoose');

// ─── Hôtel (Espace Hôtel / Hébergement) ───
const hotelSchema = new mongoose.Schema({

  proprietaire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  nom: { type: String, required: true, trim: true, maxlength: 60 },
  description: { type: String, trim: true, maxlength: 500, default: '' },

  photos: { type: [String], default: [] },
  equipements: { type: [String], default: [] }, // ex: "Wifi", "Piscine", "Parking"

  logo: { type: String, default: '' },
  couleurPrincipale: { type: String, default: '#007AFF' },

  localisation: {
    pays: { type: String, trim: true, default: 'Bénin' },
    ville: { type: String, trim: true },
    quartier: { type: String, trim: true },
    details: { type: String, trim: true }
  },

  statut: { type: String, enum: ['active', 'suspendue'], default: 'active' },

  abonnementPro: {
    actif: { type: Boolean, default: false },
    plan: { type: String, enum: ['pro_mensuel', 'pro_annuel', null], default: null },
    dateFin: { type: Date, default: null }
  }

}, {
  timestamps: true
});

hotelSchema.index({ proprietaire: 1 });
hotelSchema.index({ nom: 'text', description: 'text' });

module.exports = mongoose.model('Hotel', hotelSchema);
