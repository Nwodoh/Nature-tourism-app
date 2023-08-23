const AppError = require('./../utilities/AppError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;

  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate field value: ${err.keyValue.name}`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errorStr = Object.values(err.errors)
    .map((err) => err.properties.message)
    .join('. ');

  const message = `Invalid input data: ${errorStr}`;

  return new AppError(message, 404);
};

const handleJWTError = () =>
  new AppError('Invalid token, please log in again', 401);

const handleJWTExpiredError = () =>
  new AppError('Yor session expired, Log in again to get access');

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    console.log(req.originalUrl);
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Error on your request',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  } else {
    if (err.isOperational) {
      return res.status(err.statusCode).render('error', {
        title: 'Error on your request',
        msg: err.message,
      });
    }
    return res.status(err.statusCode).render('error', {
      title: 'Error on your request',
      msg: 'Something went wrong. Please try again later!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') sendErrorDev(err, req, res);
  else if (process.env.NODE_ENV == 'production') {
    let error = { ...err, name: err.name };
    // NOTE THIS TRICK TO MAKE SURE MESSAGE IS ALSO COPIED
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);

    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    if (error.name === 'ValidationError') error = handleValidationErrorDB(err);

    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
