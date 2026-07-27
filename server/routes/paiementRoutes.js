const express = require('express');
const router = express.Router();
const {
  createPaiement,
  getStatutAbonnement,
  getHistorique,
  confirmerPaiement,
  simulerConfirmation,
  getOffres
} = require('../controllers/paiementController');
const auth = require('../middleware/auth');

// ─── Routes publiques ───
router.get('/offres', getOffres);

// ─── Routes protégées ───
router.post('/', auth, createPaiement);
router.get('/statut', auth, getStatutAbonnement);
router.get('/historique', auth, getHistorique);
router.put('/:id/confirmer', confirmerPaiement); // Authentification via clé secrète webhook (voir contrôleur)
router.put('/:id/simuler', auth, simulerConfirmation);

module.exports = router;
