/**
 * Configurable Referral / Level Income Commission Rules
 *
 * NOTE: As documented in docs/05-business-rules-and-assumptions.md, these commission tiers
 * represent standard multi-tier test fixtures.
 * Default tiers: Level 1 = 5.0%, Level 2 = 3.0%, Level 3 = 2.0% of investment principal.
 */

const REFERRAL_CONFIG = {
  maxDepth: 3, // Support up to 3 tiers of upstream referral rewards
  tiers: [
    { level: 1, name: 'Direct Sponsor', percentage: 5.0 }, // 5%
    { level: 2, name: 'Secondary Uplink', percentage: 3.0 }, // 3%
    { level: 3, name: 'Tertiary Uplink', percentage: 2.0 },  // 2%
  ],
  requireActiveStatus: true, // Only uplinks with accountStatus === 'Active' receive rewards
};

const getCommissionRateForLevel = (level) => {
  const tier = REFERRAL_CONFIG.tiers.find(t => t.level === level);
  return tier ? tier.percentage : 0;
};

module.exports = {
  REFERRAL_CONFIG,
  getCommissionRateForLevel,
};
