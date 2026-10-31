import axios from 'axios';

// Normalize API base URL: trim whitespace, strip trailing slashes, and guarantee /api prefix
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').trim();
const cleanUrl = rawBaseUrl.replace(/\/+$/, '');
const API_BASE_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: Inject Bearer token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nexachain_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract response data and handle auth expiration
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // If 401 Unauthorized, token has expired or is invalid
      if (error.response.status === 401 && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('nexachain_token');
        localStorage.removeItem('nexachain_user');
        window.location.href = '/login?expired=1';
      }

      const errorMessage =
        error.response.data?.message ||
        error.response.data?.errors?.[0]?.message ||
        'Server error occurred';
      return Promise.reject(new Error(errorMessage));
    }
    return Promise.reject(new Error(error.message || 'Network error, please check connection'));
  }
);

export default client;
