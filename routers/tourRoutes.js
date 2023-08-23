// 3rd party modules
const express = require('express');
// CUstiom modules
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./reviewRoutes');

// ROUTERS
const router = express.Router();

// Nested routes: /tour/1239tourId/reviews/0034302reviewId
router.use('/:tourId/review', reviewRouter);

// tour routes
router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plans/:year')
  .get(
    authController.protect,
    authController.restrictTo('guide', 'lead-guide', 'admin'),
    tourController.getMonthlyPlan
  );

router
  .route('/top-5-cheap')
  .get(tourController.aliasCheapFive, tourController.getAllTours);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getTourWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('lead-guide', 'admin'),
    tourController.postTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('lead-guide', 'admin'),
    tourController.uploadTourPhoto,
    tourController.resizeTourPhoto,
    tourController.patchTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('lead-guide', 'admin'),
    tourController.deleteTour
  );

module.exports = router;
