const Review = require('./../models/reviewModel');
// const catchAsync = require('./../utilities/catchAsync');
// const AppError = require('./../utilities/AppError');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tour;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.postReview = factory.createOne(Review);
exports.getAllReviews = factory.getAll(Review);
exports.getReviews = factory.getOne(Review);
exports.patchReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
