import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token from localStorage to every outgoing request
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eduflow_token') || localStorage.getItem('joineazy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 responses to clear stale sessions
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 if not already on the login or register page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('eduflow_token');
        localStorage.removeItem('eduflow_user');
        localStorage.removeItem('joineazy_token');
        localStorage.removeItem('joineazy_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
