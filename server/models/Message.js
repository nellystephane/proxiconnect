const mongoose = require('mongoose');

// ─── Message (Messagerie) ───
const messageSchema = new mongoose.Schema({

  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  expediteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contenu: { type: String, required: true, trim: true, maxlength: 2000 },
  lu: { type: Boolean, default: false }

}, {
  timestamps: true
});

messageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
