// client/src/lib/api.ts (OVERWRITE THIS FILE)
import axios from "axios";

// Ek standard axios instance create kar rahe hain
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Yeh session cookies (login) ko bhej ne ke liye important hai
});

// Response interceptor error handling ke liye
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Agar server se error message aata hai, toh usko throw karo
    if (error.response && error.response.data && error.response.data.message) {
      return Promise.reject(new Error(error.response.data.message));
    }
    // Warna default error
    return Promise.reject(error);
  }
);

// Hum 'api' ko as a default export bhej rahe hain
export default api;