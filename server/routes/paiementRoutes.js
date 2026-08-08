const express = require('express');
const router = express.Router();
const {
  createPaiement,
  getStatutAbonnement,
  getHistorique,
  getPaiementById,
  confirmerPaiement,
  simulerConfirmation,
  getOffres,
  getOffresPro,
  createPaiementPro,
  getStatutPro
} = require('../controllers/paiementController');
const auth = require('../middleware/auth');

// ─── Routes publiques ───
router.get('/offres', getOffres);
router.get('/offres-pro', getOffresPro);

// ─── Routes protégées ───
router.post('/', auth, createPaiement);
router.post('/pro', auth, createPaiementPro);
router.get('/statut', auth, getStatutAbonnement);
router.get('/statut-pro', auth, getStatutPro);
router.get('/historique', auth, getHistorique);
router.get('/:id', auth, getPaiementById);
router.put('/:id/confirmer', confirmerPaiement); // Authentification via clé secrète webhook (voir contrôleur)
router.put('/:id/simuler', auth, simulerConfirmation);

module.exports = router;
