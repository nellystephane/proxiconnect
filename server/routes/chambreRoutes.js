const express = require('express');
const router = express.Router();
const { createChambre, updateChambre, deleteChambre, getChambres } = require('../controllers/chambreController');
const auth = require('../middleware/auth');

router.get('/', getChambres);
router.post('/', auth, createChambre);
router.put('/:id', auth, updateChambre);
router.delete('/:id', auth, deleteChambre);

module.exports = router;
