import React from 'react';
import { Navigate } from 'react-router-dom';
import { useHRMSAuth } from '../contexts/HRMSAuthContext';

const ProtectedHRMSRoute = ({ children, requiredPermission }) => {
  const { isAuthenticated, loading, hasPermission } = useHRMSAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/hrms/login"
        replace
        state={{ message: 'Please sign in with an account that has HRMS access.' }}
      />
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/hrms/dashboard" replace state={{ message: 'You are not authorized to view that HRMS section.' }} />;
  }

  return children;
};

export default ProtectedHRMSRoute;
