const express = require('express');
const router = express.Router();
const { createAvis, getAvisByUser, getMesAvis, signalerAvis } = require('../controllers/avisController');
const auth = require('../middleware/auth');

// ─── Routes publiques ───
router.get('/utilisateur/:id', getAvisByUser);

// ─── Routes protégées ───
router.post('/', auth, createAvis);
router.get('/mes-avis', auth, getMesAvis);
router.put('/:id/signaler', auth, signalerAvis);

module.exports = router;