const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
    trim: true,
    maxlength: [
      40,
      `A User's name must be less than or equal to 40 characters`,
    ],
    minlength: [
      2,
      `A User's name must be greater than or equal to 2 characters`,
    ],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email address'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email.'],
    maxlength: [
      100,
      `A user's email address must be less than or equal to 100 characters`,
    ],
    minlength: [
      5,
      `A user's email address must be greater than or equal to 5 characters`,
    ],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'guide', 'lead-guide', 'admin'],
      message: 'Role can only be either: user, guide, lead-guide, admin',
    },
    default: 'user',
  },
  password: {
    type: String,
    required: [true, `Please provide a password`],
    minlength: [8, 'Your password must not be less than 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, `Please confirm your password`],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
    minlength: [8, 'Your password must not be less than 8 characters'],
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpire: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });

  next();
});

userSchema.methods.isCorrectPassword = async function (
  candidatePassword,
  encryptedPassword
) {
  return await bcrypt.compare(candidatePassword, encryptedPassword);
};

userSchema.methods.isPasswordChanged = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedAtTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return changedAtTimeStamp > JWTTimeStamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetTokenExpire = Date.now() + 10 * 1000 * 60;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
