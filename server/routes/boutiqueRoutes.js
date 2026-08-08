const express = require('express');
const router = express.Router();
const {
  createBoutique,
  getMaBoutique,
  getBoutiquePublique,
  getBoutiques,
  updateBoutique
} = require('../controllers/boutiqueController');
const auth = require('../middleware/auth');

// ─── Routes protégées (avant /:id pour ne pas être capturées comme un id) ───
router.post('/', auth, createBoutique);
router.get('/moi', auth, getMaBoutique);
router.put('/moi', auth, updateBoutique);

// ─── Routes publiques ───
router.get('/', getBoutiques);
router.get('/:id', getBoutiquePublique);

module.exports = router;
