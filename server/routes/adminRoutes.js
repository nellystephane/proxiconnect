const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  getDashboard,
  getUsers,
  getUserById,
  updateUser,
  banUser,
  deleteUser,
  getAnnonces,
  updateAnnonceStatut,
  deleteAnnonce,
  getAvis,
  masquerAvis,
  deleteAvis,
  getPaiements
} = require('../controllers/adminController');

// Toutes les routes admin nécessitent auth + admin
router.use(auth, admin);

// ─── Dashboard ───
router.get('/dashboard', getDashboard);

// ─── Utilisateurs ───
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.put('/users/:id/ban', banUser);
router.delete('/users/:id', deleteUser);

// ─── Annonces ───
router.get('/annonces', getAnnonces);
router.put('/annonces/:id/statut', updateAnnonceStatut);
router.delete('/annonces/:id', deleteAnnonce);

// ─── Avis ───
router.get('/avis', getAvis);
router.put('/avis/:id/masquer', masquerAvis);
router.delete('/avis/:id', deleteAvis);

// ─── Paiements ───
router.get('/paiements', getPaiements);

module.exports = router;

