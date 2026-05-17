const express = require('express');
const router = express.Router();
const {
  createPaiement,
  getStatutAbonnement,
  getHistorique,
  confirmerPaiement
} = require('../controllers/paiementController');
const auth = require('../middleware/auth');

// ─── Routes protégées ───
router.post('/', auth, createPaiement);
router.get('/statut', auth, getStatutAbonnement);
router.get('/historique', auth, getHistorique);
router.put('/:id/confirmer', auth, confirmerPaiement);

module.exports = router;