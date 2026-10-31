import client from './client';

export const registerUser = (userData) => {
  return client.post('/auth/register', userData);
};

export const loginUser = (credentials) => {
  return client.post('/auth/login', credentials);
};

export const getMe = () => {
  return client.get('/auth/me');
};
