import client from './client';

export const getPlans = () => {
  return client.get('/investments/plans');
};

export const createInvestment = (data) => {
  return client.post('/investments', data);
};

export const getInvestments = (params = {}) => {
  return client.get('/investments', { params });
};

export const getInvestmentById = (id) => {
  return client.get(`/investments/${id}`);
};
