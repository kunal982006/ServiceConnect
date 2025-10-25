// client/src/lib/api.ts (THE FINAL, PERMANENT FIX)

import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  withCredentials: true, // Cookies/session ke liye zaroori
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized access - redirecting to login.");
      // Jab bhi unauthorized error aaye, user ko login page par bhej do
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;