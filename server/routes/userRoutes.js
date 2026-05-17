const express = require('express');
const router = express.Router();
const { register, login, getProfil, updateProfil } = require('../controllers/userController');
const auth = require('../middleware/auth');

// ─── Routes publiques ───
router.post('/register', register);
router.post('/login', login);

// ─── Routes protégées ───
router.get('/profil', auth, getProfil);
router.put('/profil', auth, updateProfil);

module.exports = router;x