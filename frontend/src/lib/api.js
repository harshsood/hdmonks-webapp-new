import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
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
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Extract error message from API response or error object
 */
export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    'An unexpected error occurred'
  );
};

/**
 * Log API operation for debugging
 */
export const logOperation = (operation, details) => {
  console.log(`[API] ${operation}:`, details);
};

/**
 * Unified API call with error handling
 */
export const apiCall = async (method, url, data = null, options = {}) => {
  try {
    const config = {
      method,
      url,
      ...options,
    };

    if (data && (method === 'post' || method === 'put' || method === 'patch')) {
      config.data = data;
    }

    logOperation(method.toUpperCase(), { url, data });

    const response = await apiClient(config);

    if (response.data.success || response.status === 200) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
        fullResponse: response.data,
      };
    }

    throw new Error(response.data.message || 'Request failed');
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`[API Error] ${method.toUpperCase()} ${url}:`, error);
    return {
      success: false,
      error: errorMessage,
      fullError: error,
    };
  }
};

// Convenience methods
export const api = {
  get: (url, options) => apiCall('get', url, null, options),
  post: (url, data, options) => apiCall('post', url, data, options),
  put: (url, data, options) => apiCall('put', url, data, options),
  delete: (url, options) => apiCall('delete', url, null, options),
};

export default apiClient;
