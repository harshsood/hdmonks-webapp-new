import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/partner`;

const PartnerAuthContext = createContext();

export const usePartnerAuth = () => {
  const context = useContext(PartnerAuthContext);
  if (!context) {
    throw new Error('usePartnerAuth must be used within PartnerAuthProvider');
  }
  return context;
};

export const PartnerAuthProvider = ({ children }) => {
  const [partner, setPartner] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('partner_token'));
  const [loading, setLoading] = useState(true);

  const verifyToken = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPartner(response.data.partner);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Partner token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) verifyToken(); else setLoading(false);
  }, [token, verifyToken]);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/login`, { username, password });
      if (response.data.success) {
        const { token: newToken, partner: partnerData } = response.data;
        setToken(newToken);
        setPartner(partnerData);
        localStorage.setItem('partner_token', newToken);
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const logout = () => {
    setToken(null);
    setPartner(null);
    localStorage.removeItem('partner_token');
  };

  const value = { partner, token, loading, login, logout, isAuthenticated: !!partner };

  return <PartnerAuthContext.Provider value={value}>{children}</PartnerAuthContext.Provider>;
};

export const setupPartnerAxios = (token) => {
  axios.interceptors.request.use((config) => {
    if (token && config.url.includes('/partner/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, (err) => Promise.reject(err));
};
