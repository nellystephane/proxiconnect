const express = require('express');
const router = express.Router();
const {
  createRestaurant,
  getMonRestaurant,
  getRestaurantPublic,
  getRestaurants,
  updateRestaurant
} = require('../controllers/restaurantController');
const auth = require('../middleware/auth');

router.post('/', auth, createRestaurant);
router.get('/moi', auth, getMonRestaurant);
router.put('/moi', auth, updateRestaurant);

router.get('/', getRestaurants);
router.get('/:id', getRestaurantPublic);

module.exports = router;
