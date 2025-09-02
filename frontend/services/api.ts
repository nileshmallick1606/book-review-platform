import axios from 'axios';

// Create an axios instance with default configs
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors or redirect on 401
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access
      // Redirect to login page or refresh token
    }
    return Promise.reject(error);
  }
);

export default api;
