/**
 * Configurable Investment Plans
 *
 * NOTE: As documented in docs/05-business-rules-and-assumptions.md, these plan parameters
 * serve as tested reference fixtures satisfying the assessment requirements.
 * All properties are fully configurable.
 */

const INVESTMENT_PLANS = [
  {
    planId: 'starter',
    name: 'Starter AI Yield',
    minAmount: 100,
    maxAmount: 1000,
    dailyRoiPercentage: 1.0, // 1% per day
    durationDays: 30,        // 30 days tenure
    description: 'Algorithmic arbitrage trading on tier-1 crypto pairs.',
    features: ['Daily automated ROI', 'Direct level income', 'Instant withdrawal to wallet']
  },
  {
    planId: 'growth',
    name: 'Growth Neural Vault',
    minAmount: 1001,
    maxAmount: 5000,
    dailyRoiPercentage: 1.5, // 1.5% per day
    durationDays: 60,        // 60 days tenure
    description: 'Neural liquidity mining with dynamic volatility hedging.',
    features: ['Enhanced 1.5% daily yield', '3-tier referral rewards', 'Priority settlement']
  },
  {
    planId: 'enterprise',
    name: 'Enterprise Quantum',
    minAmount: 5001,
    maxAmount: 50000,
    dailyRoiPercentage: 2.0, // 2% per day
    durationDays: 90,        // 90 days tenure
    description: 'High-frequency cross-chain yield optimization.',
    features: ['Maximum 2.0% daily return', 'Full hierarchy commission', 'Dedicated account manager']
  }
];

const getPlanById = (planId) => {
  return INVESTMENT_PLANS.find(p => p.planId === planId) || null;
};

module.exports = {
  INVESTMENT_PLANS,
  getPlanById,
};
