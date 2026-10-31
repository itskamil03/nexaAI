import client from './client';

export const getDashboardSummary = () => {
  return client.get('/dashboard/summary');
};
