const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const { generateUniqueReferralCode } = require('../utils/referralCode');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { fullName, email, mobileNumber, password, referralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 'An account with this email address already exists.', 409);
    }

    let parentUser = null;
    if (referralCode && referralCode.trim() !== '') {
      parentUser = await User.findOne({
        referralCode: referralCode.trim().toUpperCase(),
      });

      if (!parentUser) {
        return sendError(
          res,
          `Invalid referral code: "${referralCode}". No referring sponsor found.`,
          400
        );
      }

      if (parentUser.accountStatus === 'Suspended') {
        return sendError(res, 'Referring sponsor account is currently inactive or suspended.', 400);
      }
    }

    // Generate unique referral code for the new user
    const newReferralCode = await generateUniqueReferralCode();

    // Create user
    const user = new User({
      fullName,
      email: email.toLowerCase(),
      mobileNumber,
      password,
      referralCode: newReferralCode,
      referredBy: parentUser ? parentUser._id : null,
      walletBalance: 0.0,
      totalRoiEarned: 0.0,
      totalLevelIncomeEarned: 0.0,
      accountStatus: 'Active',
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    return sendSuccess(
      res,
      {
        user: user.toJSON(),
        token,
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user with credentials
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendError(res, 'Invalid email or password credentials.', 401);
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password credentials.', 401);
    }

    // Check account status
    if (user.accountStatus === 'Suspended') {
      return sendError(res, 'Your account has been suspended. Please contact support.', 403);
    }

    // Generate JWT token
    const token = generateToken(user);

    return sendSuccess(
      res,
      {
        user: user.toJSON(),
        token,
      },
      'Login successful',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('referredBy', 'fullName email referralCode');
    return sendSuccess(res, { user: user.toJSON() }, 'Profile fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
