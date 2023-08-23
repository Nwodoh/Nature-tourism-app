const path = require('path');

// IMPORTING 3rd party MODULES
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

// Importing custom modules
const tourRouter = require('./routers/tourRoutes');
const usersRouter = require('./routers/usersRoutes');
const reviewRouter = require('./routers/reviewRoutes');
const bookingRouter = require('./routers/bookingRoutes');
const viewRouter = require('./routers/viewRoutes');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utilities/AppError');

const app = express();

// SETTING UP PUG
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Set security http headers
app.use(helmet());

// Body parser, reading data from body to req.body
app.use(express.json({ limit: '10kb' }));

// DATA SANITIZATION: Against NoSQL query strings
app.use(mongoSanitize());

// DATA SANITIZATION: Cross-siting scripting attacks
app.use(xss());

// Prevent parameter Pollution
app.use(
  hpp({
    whitelist: [
      'price',
      'duration',
      'difficulty',
      'maxGroupSize',
      'ratingsAverage',
      'ratingsQuantity',
    ],
  })
);

// Test middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set single Ip address request limit
const limiter = rateLimit({
  max: 100,
  windowMs: 1000 * 60 * 60,
  message: 'Too many request from this IP address, please try agin in an hour',
});
app.use('/api', limiter);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// MOUNTING ROUTERS
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // BEHIND THE SCENES OF ERROR CLASS
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);

  const errMessage = `Can't find ${req.originalUrl} on this server`;
  next(new AppError(errMessage, 404));
});

app.use(globalErrorHandler);

module.exports = app;
