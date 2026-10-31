const { WalletTransaction, User } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { roundTo2Decimals } = require('../utils/mathPrecision');

/**
 * Fetch paginated wallet transactions audit ledger
 * GET /api/wallet/transactions
 */
const getTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };
    if (req.query.type) {
      filter.transactionType = req.query.type;
    }

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WalletTransaction.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      { transactions },
      'Wallet transactions retrieved successfully',
      200,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Simulate funding wallet balance (Test / Demonstration feature)
 * POST /api/wallet/deposit
 */
const simulateDeposit = async (req, res, next) => {
  try {
    const amount = roundTo2Decimals(Number(req.body.amount));
    const note = req.body.note || 'Manual demonstration deposit';

    if (!amount || amount <= 0) {
      return sendError(res, 'Deposit amount must be greater than zero.', 422);
    }

    // Atomically increment wallet balance
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: amount } },
      { new: true }
    );

    // Create wallet ledger transaction
    const idempotencyKey = `dep:${req.user._id}:${Date.now()}:${Math.floor(Math.random() * 1000)}`;
    const tx = new WalletTransaction({
      userId: req.user._id,
      transactionType: 'WALLET_DEPOSIT',
      direction: 'CREDIT',
      amount,
      sourceRecordRef: 'Deposit',
      idempotencyKey,
      status: 'SUCCESS',
      description: `Wallet top-up (${note})`,
      balanceAfter: updatedUser.walletBalance,
      timestamp: new Date(),
    });
    await tx.save();

    return sendSuccess(
      res,
      {
        walletBalance: updatedUser.walletBalance,
        transaction: tx,
      },
      `Successfully funded $${amount.toFixed(2)} to wallet`,
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  simulateDeposit,
};
