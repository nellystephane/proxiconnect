const express = require('express');
const router = express.Router();
const { createPlat, updatePlat, deletePlat, getPlats } = require('../controllers/platController');
const auth = require('../middleware/auth');

router.get('/', getPlats);
router.post('/', auth, createPlat);
router.put('/:id', auth, updatePlat);
router.delete('/:id', auth, deletePlat);

module.exports = router;
