/**
 * High-precision monetary rounding and calculation utilities.
 * Mitigates IEEE 754 double precision floating-point drift and invalid values.
 */

/**
 * Rounds a number to exactly two decimal places using epsilon compensation.
 * @param {number} value
 * @returns {number}
 */
const roundTo2Decimals = (value) => {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return 0;
  }
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

/**
 * Converts a floating currency value into integer cents for arithmetic.
 * @param {number} amount
 * @returns {number}
 */
const toCents = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    return 0;
  }
  return Math.round((amount + Number.EPSILON) * 100);
};

/**
 * Converts integer cents back to dollar amount with 2 decimal places.
 * @param {number} cents
 * @returns {number}
 */
const fromCents = (cents) => {
  if (typeof cents !== 'number' || isNaN(cents) || !isFinite(cents)) {
    return 0;
  }
  return roundTo2Decimals(cents / 100);
};

module.exports = {
  roundTo2Decimals,
  toCents,
  fromCents,
};
