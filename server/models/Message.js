const mongoose = require('mongoose');

// ─── Message (Messagerie) ───
const messageSchema = new mongoose.Schema({

  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  expediteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // "contenu" reste obligatoire pour un message texte classique, mais devient
  // facultatif dès qu'une pièce jointe est fournie (un message peut être
  // uniquement une image/un document, sans texte).
  contenu: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: '',
    required: function () { return !this.pieceJointe || !this.pieceJointe.url; }
  },
  // ─── Pièce jointe optionnelle : image, PDF ou document courant.
  // Absent sur tous les messages existants — aucune migration nécessaire. ───
  pieceJointe: {
    url: { type: String, trim: true },
    nom: { type: String, trim: true },
    type: { type: String, trim: true },
    taille: { type: Number }
  },
  lu: { type: Boolean, default: false }

}, {
  timestamps: true
});

messageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
