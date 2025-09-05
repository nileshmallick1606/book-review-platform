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
    // Add auth token from localStorage if it exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
      // Clear token and redirect to login page
      localStorage.removeItem('token');
      
      // Check if window is defined (browser environment)
      if (typeof window !== 'undefined') {
        // Redirect to login page using assign method
        window.location.assign('/auth/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
