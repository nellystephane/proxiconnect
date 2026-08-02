const express = require('express');
const router = express.Router();
const { createLivreur, getMonProfil, updateMonProfil, getLivreurs, getLivreurPublic } = require('../controllers/livreurController');
const auth = require('../middleware/auth');

router.post('/', auth, createLivreur);
router.get('/moi', auth, getMonProfil);
router.put('/moi', auth, updateMonProfil);

router.get('/', getLivreurs);
router.get('/:id', getLivreurPublic);

module.exports = router;
