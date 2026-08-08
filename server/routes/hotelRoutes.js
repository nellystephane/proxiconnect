const express = require('express');
const router = express.Router();
const { createHotel, getMonHotel, getHotelPublic, getHotels, updateHotel } = require('../controllers/hotelController');
const auth = require('../middleware/auth');

router.post('/', auth, createHotel);
router.get('/moi', auth, getMonHotel);
router.put('/moi', auth, updateHotel);

router.get('/', getHotels);
router.get('/:id', getHotelPublic);

module.exports = router;
