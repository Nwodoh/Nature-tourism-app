const express = require('express');

const authController = require('./../controllers/authController');
const reviewController = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.postReview
  );

router
  .route('/:id')
  .get(reviewController.getReviews)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.patchReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
