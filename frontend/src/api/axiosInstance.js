import axios from 'axios';
import toast from 'react-hot-toast';
import { getCsrfHeaders } from '../utils/csrf';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send httpOnly cookie automatically
});

let isRefreshing = false;
let failedQueue = [];
let storeRef = null;

export const setStoreRef = (store) => {
  storeRef = store;
};

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor - handles 401 with automatic token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for auth endpoints to prevent infinite loops
    if (originalRequest.url?.includes('/auth/refresh-token') || 
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/logout')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // No need to send refreshToken in body - httpOnly cookie sent automatically via withCredentials: true
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = data.data.accessToken;

        // Update Redux store only (refresh token in httpOnly cookie)
        if (storeRef) {
          const { setAccessToken } = await import('../features/auth/authSlice');
          storeRef.dispatch(setAccessToken(newToken));
        }

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Logout user
        try {
          localStorage.removeItem('hasSession');
        } catch {}
        if (storeRef) {
          storeRef.dispatch({ type: 'auth/clearCredentials' });
        }

        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Request interceptor - add access token from Redux store and CSRF token
axiosInstance.interceptors.request.use(
  (config) => {
    // Add Authorization header from Redux store
    if (storeRef) {
      const state = storeRef.getState();
      const token = state.auth?.accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Add CSRF token for state-changing requests
    const method = (config.method || 'get').toLowerCase();
    const url = config.url || '';
    const csrfHeaders = getCsrfHeaders(method, url);
    if (csrfHeaders) {
      Object.assign(config.headers, csrfHeaders);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
