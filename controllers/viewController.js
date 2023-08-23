const Tour = require('./../models/tourModel');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/AppError');

exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
  });

  if (!tour) return next(new AppError('There is no tour with that name!'));

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLogin = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Login',
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: 'User account',
  });
});
