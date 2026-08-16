const EvaluationLivreur = require('../models/EvaluationLivreur');
const DemandeLivraison = require('../models/DemandeLivraison');
const Livreur = require('../models/Livreur');
const { creerNotification } = require('../utils/notifier');

// ─── Recalcule et persiste la note moyenne dénormalisée du livreur (lecture
// rapide sur le profil, sans agrégation à chaque affichage). ───
const recalculerMoyenne = async (livreurUserId) => {
  const stats = await EvaluationLivreur.aggregate([
    { $match: { livreur: livreurUserId } },
    { $group: { _id: '$livreur', moyenne: { $avg: '$note' }, total: { $sum: 1 } } }
  ]);
  const { moyenne = 0, total = 0 } = stats[0] || {};
  await Livreur.findOneAndUpdate(
    { utilisateur: livreurUserId },
    { noteMoyenne: Math.round(moyenne * 10) / 10, nombreEvaluations: total }
  );
  return { moyenne: Math.round(moyenne * 10) / 10, total };
};

// POST /api/evaluations-livreur — noter une livraison terminée
const creerEvaluation = async (req, res) => {
  try {
    const { livraisonId, note, commentaire } = req.body;

    const noteNum = Number(note);
    if (!livraisonId || !Number.isInteger(noteNum) || noteNum < 1 || noteNum > 5) {
      return res.status(400).json({ message: 'Merci de donner une note entre 1 et 5.' });
    }

    const livraison = await DemandeLivraison.findById(livraisonId);
    if (!livraison) return res.status(404).json({ message: 'Livraison introuvable.' });

    // ─── Règles métier obligatoires ───
    if (livraison.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Seul le client de cette livraison peut l\'évaluer.' });
    }
    if (livraison.statut !== 'livrée') {
      return res.status(400).json({ message: "Cette livraison n'est pas encore terminée." });
    }
    if (!livraison.livreur) {
      return res.status(400).json({ message: 'Aucun livreur associé à cette livraison.' });
    }

    let evaluation;
    try {
      evaluation = await EvaluationLivreur.create({
        livreur: livraison.livreur,
        livraison: livraison._id,
        client: req.user._id,
        note: noteNum,
        commentaire: (commentaire || '').trim()
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: 'Vous avez déjà évalué cette livraison.' });
      }
      throw err;
    }

    const { moyenne, total } = await recalculerMoyenne(livraison.livreur);

    await creerNotification(
      req.app.get('io'),
      livraison.livreur,
      'nouvelle_evaluation_livreur',
      'Nouvelle évaluation reçue',
      `Vous avez reçu une note de ${noteNum}/5.`,
      '/livraison'
    );

    res.status(201).json({ evaluation, noteMoyenne: moyenne, nombreEvaluations: total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/evaluations-livreur/:livreurId — historique + stats d'un livreur (profil public)
const getEvaluationsLivreur = async (req, res) => {
  try {
    const evaluations = await EvaluationLivreur.find({ livreur: req.params.livreurId })
      .populate('client', 'nom prenom photo')
      .sort({ createdAt: -1 })
      .limit(50);

    const livreurDoc = await Livreur.findOne({ utilisateur: req.params.livreurId }).select('noteMoyenne nombreEvaluations');

    res.json({
      evaluations,
      noteMoyenne: livreurDoc?.noteMoyenne || 0,
      nombreEvaluations: livreurDoc?.nombreEvaluations || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/evaluations-livreur/livraison/:livraisonId/statut — le client peut-il encore évaluer cette livraison ?
const getStatutEvaluation = async (req, res) => {
  try {
    const livraison = await DemandeLivraison.findById(req.params.livraisonId);
    if (!livraison) return res.status(404).json({ message: 'Livraison introuvable.' });
    if (livraison.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const dejaEvaluee = await EvaluationLivreur.exists({ livraison: livraison._id, client: req.user._id });

    res.json({
      peutEvaluer: livraison.statut === 'livrée' && !!livraison.livreur && !dejaEvaluee,
      dejaEvaluee: !!dejaEvaluee,
      livraisonTerminee: livraison.statut === 'livrée'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { creerEvaluation, getEvaluationsLivreur, getStatutEvaluation };
