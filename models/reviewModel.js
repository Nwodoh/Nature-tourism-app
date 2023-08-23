const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    author: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A review must have an author'],
      },
    ],
    tour: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A review must have an tour'],
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Preventing duplicate reviews
reviewSchema.index({ tour: 1, author: 1 }, { unique: true });

// post query middleware: replace parent refrenced IDs with data
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'author',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcTourAverageRating = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcTourAverageRating(this.tour);
});

reviewSchema.post(/^findOneAnd/, function (doc) {
  doc.constructor.calcTourAverageRating(doc.tour[0]);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
