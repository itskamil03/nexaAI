import client from './client';

export const getRoiHistory = (params = {}) => {
  return client.get('/roi/history', { params });
};
