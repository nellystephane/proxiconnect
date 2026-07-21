const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfil,
  updateProfil,
  changePassword,
  deleteAccount,
  toggleFavori,
  getFavoris
} = require('../controllers/userController');
const auth = require('../middleware/auth');

// ─── Routes publiques ───
router.post('/register', register);
router.post('/login', login);

// ─── Routes protégées ───
router.get('/profil', auth, getProfil);
router.put('/profil', auth, updateProfil);
router.put('/password', auth, changePassword);
router.delete('/', auth, deleteAccount);       // DELETE /api/users
router.get('/favoris', auth, getFavoris);
router.put('/favoris/:annonceId', auth, toggleFavori);

module.exports = router;
