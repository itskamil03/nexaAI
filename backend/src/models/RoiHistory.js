const mongoose = require('mongoose');

const roiHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    investmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Investment',
      required: [true, 'Investment reference is required'],
      index: true,
    },
    roiAmount: {
      type: Number,
      required: [true, 'ROI amount is required'],
      min: [0, 'ROI amount cannot be negative'],
    },
    date: {
      type: String,
      required: [true, 'Normalized processing date (YYYY-MM-DD) is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Credited', 'Failed', 'Skipped'],
        message: '{VALUE} is not a valid ROI status',
      },
      default: 'Credited',
      index: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// CRITICAL UNIQUE COMPOUND INDEX: Guarantees zero duplicate ROI payouts for the same investment and calendar date
roiHistorySchema.index(
  { investmentId: 1, date: 1 },
  { unique: true, name: 'unique_roi_per_investment_and_date' }
);

roiHistorySchema.index({ userId: 1, date: -1 });

const RoiHistory = mongoose.model('RoiHistory', roiHistorySchema);

module.exports = RoiHistory;
