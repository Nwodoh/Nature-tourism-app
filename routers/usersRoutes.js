const express = require('express');
const router = express.Router();
const usersController = require('./../controllers/usersController');
const authController = require('./../controllers/authController');

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/logout').get(authController.logout);
router.route('/forgot-password').post(authController.forgotPassword);
router.route('/reset-password/:token').patch(authController.resetPassword);

// Protect all routes AFTER this middleware
router.use(authController.protect);

// USERS ROUTE
router.route('/me').get(usersController.getMe, usersController.getOneUser);

router
  .route('/update-me')
  .patch(
    usersController.uploadUserPhoto,
    usersController.resizeUserPhoto,
    usersController.updateMe
  );

router.route('/delete-me').delete(usersController.deleteMe);

router.route('/update-password').patch(authController.updatePassWord);

// Restrict to admin all routes AFTER this middleware
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(usersController.getAllUsers)
  .post(usersController.createNewUser);

router
  .route('/:id')
  .get(usersController.getOneUser)
  .patch(usersController.updateUser)
  .delete(usersController.deleteUser);

module.exports = router;
