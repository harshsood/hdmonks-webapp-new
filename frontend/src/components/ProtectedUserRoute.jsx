import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserAuth } from '../contexts/UserAuthContext';

const ProtectedUserRoute = ({ children }) => {
  const { isAuthenticated, loading } = useUserAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-orange-500" /></div>;
  }

  return isAuthenticated ? children : <Navigate to="/" replace state={{ openUserAuth: true }} />;
};

export default ProtectedUserRoute;
