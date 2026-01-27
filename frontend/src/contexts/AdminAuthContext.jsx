import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/admin`;

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(true);

  const verifyToken = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAdmin(response.data.admin);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token, verifyToken]);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/login`, { username, password });
      if (response.data.success) {
        const { token: newToken, admin: adminData } = response.data;
        setToken(newToken);
        setAdmin(adminData);
        localStorage.setItem('admin_token', newToken);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('admin_token');
  };

  const value = {
    admin,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!admin
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// Axios interceptor to add auth token
export const setupAxiosInterceptor = (token) => {
  axios.interceptors.request.use(
    (config) => {
      if (token && config.url.includes('/admin/')) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};
