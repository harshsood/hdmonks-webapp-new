import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BriefcaseBusiness, CalendarDays, ClipboardList, LogOut } from 'lucide-react';
import axios from 'axios';
import { useUserAuth } from '../contexts/UserAuthContext';

const UserDashboard = () => {
  const { user, token, logout } = useUserAuth();
  const [dashboard, setDashboard] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => setDashboard(response.data.data));
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const stats = [
    { label: 'Active projects', value: dashboard?.active_projects ?? 0, icon: BriefcaseBusiness },
    { label: 'Open requests', value: dashboard?.open_requests ?? 0, icon: ClipboardList },
    { label: 'Upcoming consultations', value: dashboard?.upcoming_consultations ?? 0, icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-bold tracking-tight text-gray-900">HD <span className="text-orange-500">MONKS</span></Link>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">Client workspace</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Good to see you, {user?.full_name?.split(' ')[0]}.</h1>
          <p className="mt-2 text-gray-600">Keep an eye on your projects, requests, and consultations in one place.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <Icon className="h-6 w-6 text-orange-500" />
              <p className="mt-5 text-3xl font-bold text-gray-900">{value}</p>
              <p className="mt-1 text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Account details</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-gray-500">Name</dt><dd className="mt-1 font-medium text-gray-900">{user?.full_name}</dd></div>
            <div><dt className="text-sm text-gray-500">Email</dt><dd className="mt-1 font-medium text-gray-900">{user?.email}</dd></div>
          </dl>
        </section>
      </main>
    </div>
  );
};

export default UserDashboard;
