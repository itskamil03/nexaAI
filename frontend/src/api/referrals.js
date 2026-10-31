import client from './client';

export const getDirectReferrals = () => {
  return client.get('/referrals/direct');
};

export const getReferralTree = (maxDepth = 3) => {
  return client.get('/referrals/tree', { params: { maxDepth } });
};

export const getReferralIncomeHistory = (params = {}) => {
  return client.get('/referrals/income', { params });
};
