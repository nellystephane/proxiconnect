const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  motDePasse: {
    type: String,
    required: true
  },
  telephone: {
    type: String,
    trim: true
  },
  photo: {
    type: String,
    default: ''
  },
  localisation: {
    pays: {
      type: String,
      trim: true
    },
    ville: {
      type: String,
      trim: true
    },
    quartier: {
      type: String,
      trim: true
    },
    details: {
      type: String,
      trim: true
    }
  }, 
  estVerifie: {
    type: Boolean,
    default: false
  },
  // ─── Présence : dernier instant où l'utilisateur a été vu actif (mis à
  // jour à la déconnexion du dernier socket ouvert). Le statut "en ligne"
  // lui-même n'est jamais persisté ici : il vit uniquement en mémoire côté
  // serveur (voir utils/presence.js), ce qui évite qu'un crash serveur ou
  // une fermeture d'application laisse un utilisateur "en ligne" indéfiniment. ───
  dernierActivite: {
    type: Date,
    default: Date.now
  },
  favoris: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Annonce'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);