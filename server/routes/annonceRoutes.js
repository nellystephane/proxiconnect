const express = require('express');
const router = express.Router();
const {
  createAnnonce,
  getAnnonces,
  getAnnonceById,
  updateAnnonce,
  deleteAnnonce,
  getMesAnnonces
} = require('../controllers/annonceController');
const auth = require('../middleware/auth');


// ─── Routes protégées ───
router.post('/', auth, createAnnonce);
router.put('/:id', auth, updateAnnonce);
router.delete('/:id', auth, deleteAnnonce);
router.get('/mes-annonces', auth, getMesAnnonces);


// ─── Routes publiques ───
router.get('/', getAnnonces);
router.get('/:id', getAnnonceById);



module.exports = router;