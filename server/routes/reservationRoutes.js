const express = require('express');
const router = express.Router();
const {
  createReservation,
  getMesReservations,
  getReservationsRecues,
  updateStatutReservation,
  getReservationsChambre
} = require('../controllers/reservationController');
const auth = require('../middleware/auth');

router.post('/', auth, createReservation);
router.get('/mes-reservations', auth, getMesReservations);
router.get('/recues', auth, getReservationsRecues);
router.get('/chambre/:chambreId', getReservationsChambre);
router.put('/:id/statut', auth, updateStatutReservation);

module.exports = router;
