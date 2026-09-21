import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/user/hrms`;
const HRMS_TOKEN_KEY = 'hrms_token';
const HRMSAuthContext = createContext();

export const useHRMSAuth = () => {
  const context = useContext(HRMSAuthContext);
  if (!context) throw new Error('useHRMSAuth must be used within HRMSAuthProvider');
  return context;
};

export const HRMSAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [token, setToken] = useState(localStorage.getItem(HRMS_TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    const currentToken = token;
    setUser(null);
    setRoles([]);
    setPermissions([]);
    setToken(null);
    localStorage.removeItem(HRMS_TOKEN_KEY);

    if (currentToken) {
      try {
        await axios.post(`${API}/logout`, null, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch (error) {
        // The local session is cleared even when the server session already expired.
      }
    }
  }, [token]);

  const verifyToken = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setUser(response.data.user);
        setRoles(response.data.roles || []);
        setPermissions(response.data.permissions || []);
      }
      else await logout();
    } catch (error) {
      await logout();
    } finally {
      setLoading(false);
    }
  }, [logout, token]);

  const refreshAuthorization = useCallback(async () => {
    if (!token) return false;
    try {
      const response = await axios.get(`${API}/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.data.success) return false;
      setUser(response.data.user);
      setRoles(response.data.roles || []);
      setPermissions(response.data.permissions || []);
      return true;
    } catch (error) {
      return false;
    }
  }, [token]);

  useEffect(() => {
    if (token) verifyToken();
    else setLoading(false);
  }, [token, verifyToken]);

  const login = async (identifier, password, rememberMe) => {
    try {
      const response = await axios.post(`${API}/login`, {
        identifier,
        password,
        remember_me: rememberMe,
      });
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      setRoles(response.data.roles || []);
      setPermissions(response.data.permissions || []);
      localStorage.setItem(HRMS_TOKEN_KEY, newToken);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        error: error.response?.data?.detail || 'Unable to sign in to HRMS',
      };
    }
  };

  const hasPermission = (permission) => permissions.includes(permission);
  const hasAnyPermission = (requiredPermissions) => requiredPermissions.some(hasPermission);

  return (
    <HRMSAuthContext.Provider value={{ user, roles, permissions, token, loading, login, logout, refreshAuthorization, hasPermission, hasAnyPermission, isAuthenticated: !!user }}>
      {children}
    </HRMSAuthContext.Provider>
  );
};
