const mongoose = require('mongoose');

const CATEGORIES_PLAT = ['Entrées', 'Plats', 'Desserts', 'Boissons'];

// ─── Plat (Espace Restauration) ───
const platSchema = new mongoose.Schema({

  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  createur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  nom: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  categorie: { type: String, required: true, trim: true },

  prix: { type: Number, required: true, min: 0 },
  photo: { type: String, default: '' },

  epice: { type: Boolean, default: false },
  disponible: { type: Boolean, default: true },
  estMisEnAvant: { type: Boolean, default: false }

}, {
  timestamps: true
});

platSchema.index({ restaurant: 1, disponible: 1 });

module.exports = mongoose.model('Plat', platSchema);
module.exports.CATEGORIES_PLAT = CATEGORIES_PLAT;
