import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePartnerAuth } from '../contexts/PartnerAuthContext';

const ProtectedPartnerRoute = ({ children }) => {
  const { isAuthenticated, loading } = usePartnerAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/partner/login" replace />;
  }

  return children;
};

export default ProtectedPartnerRoute;
