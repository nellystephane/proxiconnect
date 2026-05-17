const mongoose = require('mongoose');

const paiementSchema = new mongoose.Schema({

  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  type: {
    type: String,
    enum: ['abonnement_30j', 'abonnement_90j', 'abonnement_annuel'],
    required: true
  },

  avantages: {
    nombreAnnonces: Number,
    videoAutorisee: Boolean,
    miseEnAvant: Boolean,
    dureeAnnonce: Number
  },

  montant: {
    type: Number,
    required: true
  },
  devise: {
    type: String,
    default: 'XOF'
  },

  methode: {
    type: String,
    enum: ['mobile_money', 'carte', 'virement'],
    required: true
  },
  operateur: {
    type: String,
    enum: ['orange_money', 'mtn_money', 'moov_money', 'wave', 'celtiis', 'autre'],
    default: null
  },
  numeroTransaction: {
    type: String,
    default: null
  },

  statut: {
    type: String,
    enum: ['en_attente', 'confirmé', 'échoué', 'remboursé', 'expiré'],
    default: 'en_attente'
  },

  dateDebut: {
    type: Date,
    default: null
  },
  dateFin: {
    type: Date,
    default: null
  },

  reference: {
    type: String,
    unique: true
  }

}, {
  timestamps: true
});

paiementSchema.pre('save', async function(next) {
  if (!this.reference) {
    this.reference = 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

paiementSchema.index({ utilisateur: 1 });
paiementSchema.index({ statut: 1 });

module.exports = mongoose.model('Paiement', paiementSchema);