const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/AppError');
const Email = require('./../utilities/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (res, user, statusCode) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 1000 * 60 * 60 * 24
    ),
    secure: true,
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'development') cookieOptions.secure = false;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    user,
    token,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    role: req.body.role,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;

  await new Email(newUser, url).sendWelcome();

  createSendToken(res, newUser, 201);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // STEP 1: Check if both email and passwords was passesd
  if (!email || !password) {
    return next(new AppError('Please input your email and password', 404));
  }

  // STEP 2: Check if both email exits and passwords is correct
  const user = await User.findOne({ email }).select('password');

  if (!user || !(await user.isCorrectPassword(password, user?.password))) {
    return next(new AppError('Please use a correct email or password'));
  }

  // STEP 3: If everythimg is okay, send token to the client
  createSendToken(res, user, 200);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'logout successfull', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};
exports.protect = catchAsync(async (req, res, next) => {
  // 1. Get token and confirm it was sent along with request
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access', 401)
    );
  }

  // 2. Verify token using JWT
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. Check if user still exists
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new AppError('This User no longer exits.'));
  }

  // 4. check if user changed password after the token has changed
  if (user.isPasswordChanged(decoded.iat)) {
    return next(
      new AppError('You changed your password. Please log in again.')
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = user;
  res.locals.user = user;
  return next();
});

// Only for rendered pages, there would be no errors
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1. Verify token using JWT
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2. Check if user still exists
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }

      // 3. check if currentUser changed password after the token has changed
      if (currentUser.isPasswordChanged(decoded.iat)) {
        return next();
      }

      // GRANT ACCESS TO PROTECTED ROUTE
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. get user based on posted EMAIL.
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('Email does not exist on our database'));
  }
  // 2. Generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. send it to users email
  try {
    const resetUrl = `${req.protocol}//${req.get(
      'host'
    )}/api/v1/users/reset-password/${resetToken}`;

    await new Email(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'The email has been sent',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpire = undefined;
    user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Please try again',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user base on token
  const hashedPassword = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedPassword,
    passwordResetTokenExpire: { $gt: Date.now() },
  });

  // If there is a user and token is not expired, set new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  user.passwordResetToken = undefined;
  user.passwordResetTokenExpire = undefined;
  await user.save();

  // Update passwordChangedAt (so that our protect router can detect which password has been changed even if user is logged in)
  // This would be executed by a pre save doc middleware on the model

  user.passwordChangedAt = Date.now();
  // login use, send new JWT
  createSendToken(res, user, 201);
});

exports.updatePassWord = catchAsync(async (req, res, next) => {
  // 1. Check if user is logged in. : DONE by protect middleware
  // 2. Get actual user using req.user.id coming from protect middleware
  const user = await User.findById({ _id: req.user._id }).select('password');

  // 3. confirm if sent password is the same a encrypted on. If not send error
  if (!(await user.isCorrectPassword(req.body.password, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 4. Encrypt new password : this is done by the save middleware on every new saved doc. Except if explitely said not to by validateBeforeSave: false

  // 5. change password and update passwordChangeAt (password cahnge at is excuted already as a pre-save doc middleware)
  const newPassword = req.body.newPassword;
  const newPasswordConfirm = req.body.newPasswordConfirm;

  if (newPassword !== newPasswordConfirm) {
    return next(
      new AppError(
        'Passwords Are not the same! Please try again with marching passwords'
      )
    );
  }

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();

  // Login user and send JWT
  createSendToken(res, user, 200);
});
