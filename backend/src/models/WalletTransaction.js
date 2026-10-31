const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    transactionType: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: [
          'ROI_CREDIT',
          'REFERRAL_CREDIT',
          'INVESTMENT_DEBIT',
          'WALLET_DEPOSIT',
          'ADMIN_ADJUSTMENT',
        ],
        message: '{VALUE} is not a valid transaction type',
      },
      index: true,
    },
    direction: {
      type: String,
      required: [true, 'Direction is required'],
      enum: {
        values: ['CREDIT', 'DEBIT'],
        message: '{VALUE} must be either CREDIT or DEBIT',
      },
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Transaction amount must be greater than zero'],
    },
    sourceRecordRef: {
      type: String,
      enum: ['RoiHistory', 'ReferralIncome', 'Investment', 'Deposit', 'System'],
      default: 'System',
    },
    sourceRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    idempotencyKey: {
      type: String,
      required: [true, 'Idempotency key is required for audit integrity'],
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['SUCCESS', 'PENDING', 'FAILED', 'REVERSED'],
        message: '{VALUE} is not a valid transaction status',
      },
      default: 'SUCCESS',
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    balanceAfter: {
      type: Number,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

walletTransactionSchema.index({ userId: 1, timestamp: -1 });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

module.exports = WalletTransaction;
