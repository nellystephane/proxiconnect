const mongoose = require('mongoose');

// ─── Réservation (Espace Hôtel) ───
const reservationSchema = new mongoose.Schema({

  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hotelier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  chambre: { type: mongoose.Schema.Types.ObjectId, ref: 'Chambre', required: true },

  dateArrivee: { type: Date, required: true },
  dateDepart: { type: Date, required: true },
  nombreNuits: { type: Number, required: true, min: 1 },
  montantTotal: { type: Number, required: true },

  statut: {
    type: String,
    enum: ['en_attente', 'confirmée', 'annulée', 'terminée'],
    default: 'en_attente'
  },

  note: { type: String, trim: true, maxlength: 300, default: '' }

}, {
  timestamps: true
});

reservationSchema.index({ client: 1 });
reservationSchema.index({ hotelier: 1 });
reservationSchema.index({ chambre: 1, dateArrivee: 1, dateDepart: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
