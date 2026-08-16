const express = require('express');
const router = express.Router();
const {
  creerEvaluation,
  getEvaluationsLivreur,
  getStatutEvaluation
} = require('../controllers/evaluationLivreurController');
const auth = require('../middleware/auth');

router.post('/', auth, creerEvaluation);
router.get('/livraison/:livraisonId/statut', auth, getStatutEvaluation);
router.get('/:livreurId', getEvaluationsLivreur);

module.exports = router;
