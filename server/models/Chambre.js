const mongoose = require('mongoose');

const TYPES_CHAMBRE = ['Simple', 'Double', 'Suite', 'Familiale', 'Dortoir'];

// ─── Chambre (Espace Hôtel) ───
const chambreSchema = new mongoose.Schema({

  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  createur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  type: { type: String, required: true, trim: true },
  prixParNuit: { type: Number, required: true, min: 0 },
  capacite: { type: Number, required: true, min: 1, default: 2 },

  photos: { type: [String], default: [], validate: [(val) => val.length <= 10, 'Maximum 10 photos autorisées'] },
  equipements: { type: [String], default: [] }, // ex: "Climatisation", "Wifi", "TV"

  disponible: { type: Boolean, default: true }, // désactivée manuellement par l'hôtelier (hors service)
  estMisEnAvant: { type: Boolean, default: false }

}, {
  timestamps: true
});

chambreSchema.index({ hotel: 1, disponible: 1 });

module.exports = mongoose.model('Chambre', chambreSchema);
module.exports.TYPES_CHAMBRE = TYPES_CHAMBRE;
