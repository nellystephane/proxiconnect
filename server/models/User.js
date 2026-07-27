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
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  estVerifie: {
    type: Boolean,
    default: false
  },
  estBanni: {
    type: Boolean,
    default: false
  },
  motifBannissement: {
    type: String,
    default: ''
  },
  favoris: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Annonce'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);