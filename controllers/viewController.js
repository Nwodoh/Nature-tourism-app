const Tour = require('./../models/tourModel');
const Booking = require('../models/bookingModel');
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

exports.GetMyBookings = catchAsync(async (req, res, next) => {
  // 1. Get all bookings made by user
  const bookings = await Booking.find({ user: req.user.id });
  console.log(bookings);

  // 2. Find the tours linked with the individual bookings
  const tourIDs = bookings.map((el) => el.tour);

  const tours = await Tour.find({ _id: { $in: tourIDs } });
  console.log(tourIDs);
  console.log(tours);

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.deleteBooking = catchAsync(async (req, res, next) => {
  // Recieve the tour ID(s) to be delete
  const tourIds = req.body;

  // Delete tours
  const booking = await Booking.find({
    user: req.user.id,
    tour: { $in: tourIds },
  });
  console.log(booking);
});
