import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { usePartnerAuth } from '../../contexts/PartnerAuthContext';

const PartnerLayout = () => {
  const { logout } = usePartnerAuth();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Partner Dashboard</h1>
          <nav className="space-x-4">
            <Link to="/partner/dashboard" className="text-sm">Dashboard</Link>
            <Link to="/partner/clients" className="text-sm">Clients</Link>
            <button onClick={logout} className="ml-4 text-sm text-red-600">Logout</button>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default PartnerLayout;
