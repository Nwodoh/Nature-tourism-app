const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require(`${__dirname}/../models/tourModel`);
const Booking = require(`${__dirname}/../models/bookingModel`);
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/AppError');
const factory = require('./handlerFactory');

// console.log(stripe.checkout.sessions.create);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. Get the currently booked tour
  const tour = await Tour.findById({ _id: req.params.tourId });

  // 2. Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${tour.id}&user=${
      req.user.id
    }&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  });
  // 3. Create session as response
  res.status(201).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!(tour && user && price)) return next();
  const booked = await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});
