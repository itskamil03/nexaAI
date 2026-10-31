const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Investment amount is required'],
      min: [10, 'Minimum investment amount is 10'],
    },
    planDetails: {
      planId: { type: String, required: true },
      planName: { type: String, required: true },
      durationDays: { type: Number, required: true },
      minAmount: { type: Number, required: true },
      maxAmount: { type: Number, required: true },
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
    },
    dailyRoiPercentage: {
      type: Number,
      required: [true, 'Daily ROI percentage is required'],
      min: [0, 'Daily ROI percentage cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid investment status',
      },
      default: 'Active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high performance cron and user queries
investmentSchema.index({ userId: 1, status: 1 });
investmentSchema.index({ status: 1, startDate: 1, endDate: 1 });

const Investment = mongoose.model('Investment', investmentSchema);

module.exports = Investment;
