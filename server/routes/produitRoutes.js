const express = require('express');
const router = express.Router();
const {
  createProduit,
  updateProduit,
  deleteProduit,
  getProduitById,
  getProduits
} = require('../controllers/produitController');
const auth = require('../middleware/auth');

// ─── Routes publiques ───
router.get('/', getProduits);
router.get('/:id', getProduitById);

// ─── Routes protégées ───
router.post('/', auth, createProduit);
router.put('/:id', auth, updateProduit);
router.delete('/:id', auth, deleteProduit);

module.exports = router;
