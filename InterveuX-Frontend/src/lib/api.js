// src/lib/api.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const instance = axios.create({
  baseURL: API_BASE,
  // Increased timeout to allow longer AI-backed requests (resume analysis, question generation)
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token
instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('intervuex_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('intervuex_token');
      localStorage.removeItem('intervuex_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;