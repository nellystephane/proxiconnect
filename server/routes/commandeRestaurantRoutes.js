const express = require('express');
const router = express.Router();
const {
  createCommande,
  getMesAchats,
  getCommandesRecues,
  updateStatutCommande
} = require('../controllers/commandeRestaurantController');
const auth = require('../middleware/auth');

router.post('/', auth, createCommande);
router.get('/mes-achats', auth, getMesAchats);
router.get('/recues', auth, getCommandesRecues);
router.put('/:id/statut', auth, updateStatutCommande);

module.exports = router;
