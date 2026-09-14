import React, { useEffect, useState } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useHRMSAuth } from '../../contexts/HRMSAuthContext';

const HRMSDashboard = () => {
  const { user, token, logout, hasPermission } = useHRMSAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/hrms/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAuthorized(Boolean(response.data.success));
      } catch (error) {
        await logout();
        navigate('/hrms/login', { replace: true, state: { message: 'Your HRMS session has expired or access was revoked.' } });
      } finally {
        setLoading(false);
      }
    };

    if (token) loadDashboard();
  }, [logout, navigate, token]);

  const handleLogout = async () => {
    await logout();
    navigate('/hrms/login', { replace: true });
  };

  if (loading || !authorized) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading HRMS...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-orange-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">HD MONKS</p>
              <h1 className="text-xl font-bold text-gray-900">HRMS</h1>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">Secure HR workspace</p>
        <h2 className="mt-2 text-3xl font-bold text-gray-900">Welcome, {user?.full_name?.split(' ')[0] || 'User'}.</h2>
        <p className="mt-3 max-w-2xl text-gray-600">Your HRMS access is active. HR, attendance, and payroll features will appear here as they are enabled for your organization.</p>
        <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6 text-green-800">
          <p className="font-semibold">Access verified</p>
          <p className="mt-1 text-sm">This session is authorized with the <span className="font-mono">hrms.access</span> permission.</p>
        </div>
        {hasPermission('settings.manage') && (
          <Link to="/hrms/roles" className="mt-6 inline-flex rounded-lg border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50">
            Manage HRMS roles
          </Link>
        )}
        {hasPermission('employees.view') && (
          <Link to="/hrms/employees" className="ml-3 mt-6 inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Employees
          </Link>
        )}
      </section>
    </main>
  );
};

export default HRMSDashboard;
