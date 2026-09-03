import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/user`;
const UserAuthContext = createContext();

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) throw new Error('useUserAuth must be used within UserAuthProvider');
  return context;
};

export const UserAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('user_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user_token');
  }, []);

  const verifyToken = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) setUser(response.data.user);
      else logout();
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout, token]);

  useEffect(() => {
    if (token) verifyToken();
    else setLoading(false);
  }, [token, verifyToken]);

  const authenticate = async (path, payload) => {
    try {
      const response = await axios.post(`${API}/${path}`, payload);
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('user_token', newToken);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Unable to authenticate' };
    }
  };

  const value = {
    user,
    token,
    loading,
    login: (email, password) => authenticate('login', { email, password }),
    register: (fullName, email, password) => authenticate('register', { full_name: fullName, email, password }),
    logout,
    isAuthenticated: !!user,
  };

  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>;
};
