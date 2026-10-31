import client from './client';

export const getWalletTransactions = (params = {}) => {
  return client.get('/wallet/transactions', { params });
};

export const simulateDeposit = (amount, note = '') => {
  return client.post('/wallet/deposit', { amount, note });
};
