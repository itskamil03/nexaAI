/**
 * Date normalization and boundary utilities.
 * Ensures consistent YYYY-MM-DD representation across scheduler runs and idempotent queries.
 */

/**
 * Normalizes a Date or date string to YYYY-MM-DD format.
 * @param {Date|string|number} [dateInput]
 * @returns {string}
 */
const normalizeDate = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date input provided to normalizeDate');
  }
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Adds integer days to a date and returns a new Date instance.
 * @param {Date|string} dateInput
 * @param {number} days
 * @returns {Date}
 */
const addDays = (dateInput, days) => {
  const d = new Date(dateInput);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Checks whether a given date string (YYYY-MM-DD) falls between startDate and endDate.
 * @param {string} targetDate - 'YYYY-MM-DD'
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {boolean}
 */
const isDateEligible = (targetDate, startDate, endDate) => {
  const target = new Date(`${targetDate}T00:00:00.000Z`);
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);

  return target >= start && target <= end;
};

module.exports = {
  normalizeDate,
  addDays,
  isDateEligible,
};
