const mongoose = require('mongoose');

const referralIncomeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Income beneficiary user is required'],
      index: true,
    },
    sourceUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Source user who generated income is required'],
      index: true,
    },
    sourceEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Investment',
      required: [true, 'Source investment event is required'],
      index: true,
    },
    level: {
      type: Number,
      required: [true, 'Referral level is required'],
      min: [1, 'Referral level must be at least 1'],
    },
    incomeAmount: {
      type: Number,
      required: [true, 'Income amount is required'],
      min: [0, 'Income amount cannot be negative'],
    },
    commissionPercentage: {
      type: Number,
      required: [true, 'Commission percentage is required'],
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Credited', 'Pending', 'Reversed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Credited',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: Prevents duplicate referral payouts for the same investment and level
referralIncomeSchema.index(
  { sourceEventId: 1, level: 1, userId: 1 },
  { unique: true, name: 'unique_referral_payout_per_event_level_user' }
);

referralIncomeSchema.index({ userId: 1, date: -1 });

const ReferralIncome = mongoose.model('ReferralIncome', referralIncomeSchema);

module.exports = ReferralIncome;
