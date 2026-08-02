const mongoose = require('mongoose');

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

// ─── Restaurant (Espace Restauration) ───
const restaurantSchema = new mongoose.Schema({

  proprietaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  nom: { type: String, required: true, trim: true, maxlength: 60 },
  description: { type: String, trim: true, maxlength: 500, default: '' },

  logo: { type: String, default: '' },
  banniere: { type: String, default: '' },
  couleurPrincipale: { type: String, default: '#007AFF' },

  localisation: {
    pays: { type: String, trim: true, default: 'Bénin' },
    ville: { type: String, trim: true },
    quartier: { type: String, trim: true },
    details: { type: String, trim: true }
  },

  // ─── Horaires d'ouverture ───
  horaires: [{
    jour: { type: String, enum: JOURS },
    ouverture: { type: String, default: '' }, // ex: "08:00"
    fermeture: { type: String, default: '' }, // ex: "22:00"
    ferme: { type: Boolean, default: false }
  }],

  serviceSurPlace: { type: Boolean, default: true },
  serviceAEmporter: { type: Boolean, default: true },

  statut: {
    type: String,
    enum: ['active', 'suspendue'],
    default: 'active'
  },

  abonnementPro: {
    actif: { type: Boolean, default: false },
    plan: { type: String, enum: ['pro_mensuel', 'pro_annuel', null], default: null },
    dateFin: { type: Date, default: null }
  }

}, {
  timestamps: true
});

restaurantSchema.index({ proprietaire: 1 });
restaurantSchema.index({ nom: 'text', description: 'text' });

module.exports = mongoose.model('Restaurant', restaurantSchema);
module.exports.JOURS = JOURS;
