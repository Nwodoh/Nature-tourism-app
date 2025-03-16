const express = require('express');

const authController = require('./../controllers/authController');
const bookingController = require('../controllers/bookingController');
const viewController = require('../controllers/viewController');

const router = express.Router();

router.use(authController.protect);
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.get('/my-bookings', viewController.GetMyBookings);

module.exports = router;
