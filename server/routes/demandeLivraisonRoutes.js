const express = require('express');
const router = express.Router();
const {
  createDemande,
  getDemandesDisponibles,
  accepterDemande,
  updateStatutDemande,
  getMesLivraisons,
  getMesDemandes
} = require('../controllers/demandeLivraisonController');
const auth = require('../middleware/auth');

router.post('/', auth, createDemande);
router.get('/disponibles', auth, getDemandesDisponibles);
router.get('/mes-livraisons', auth, getMesLivraisons);
router.get('/mes-demandes', auth, getMesDemandes);
router.put('/:id/accepter', auth, accepterDemande);
router.put('/:id/statut', auth, updateStatutDemande);

module.exports = router;
