const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getNombreNonLues,
  marquerCommeLue,
  marquerToutesCommeLues
} = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/', auth, getNotifications);
router.get('/non-lues', auth, getNombreNonLues);
router.put('/lues', auth, marquerToutesCommeLues);
router.put('/:id/lue', auth, marquerCommeLue);

module.exports = router;
