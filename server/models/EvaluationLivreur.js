const mongoose = require('mongoose');

// ─── Évaluation d'un livreur, après une livraison terminée. ───
// Modèle volontairement séparé du modèle "Avis" existant : celui-ci est
// verrouillé sur les annonces (champ "annonce" obligatoire + index unique
// {auteur, annonce}) et ne peut pas être détourné pour noter un livreur
// sans casser son usage actuel. La note d'un livreur doit rester distincte
// de sa note générale en tant qu'utilisateur.
const evaluationLivreurSchema = new mongoose.Schema({

  livreur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // l'utilisateur qui a livré
  livraison: { type: mongoose.Schema.Types.ObjectId, ref: 'DemandeLivraison', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // l'utilisateur qui évalue

  note: { type: Number, required: true, min: 1, max: 5 },
  commentaire: { type: String, trim: true, maxlength: 500, default: '' }

}, {
  timestamps: true
});

// Une seule évaluation par livraison et par client : empêche les doubles notations.
evaluationLivreurSchema.index({ livraison: 1, client: 1 }, { unique: true });
evaluationLivreurSchema.index({ livreur: 1, createdAt: -1 });

module.exports = mongoose.model('EvaluationLivreur', evaluationLivreurSchema);
