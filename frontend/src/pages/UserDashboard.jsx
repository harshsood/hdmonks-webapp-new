import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BriefcaseBusiness, CalendarDays, ClipboardList, LogOut, Menu, X } from 'lucide-react';
import axios from 'axios';
import { useUserAuth } from '../contexts/UserAuthContext';

const UserDashboard = () => {
  const { user, token, logout } = useUserAuth();
  const [dashboard, setDashboard] = useState(null);
  const [services, setServices] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const dashboardRequest = axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => setDashboard(response.data.data));
    const servicesRequest = axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/stages`)
      .then((response) => setServices((response.data.data || []).flatMap((stage) => stage.services || [])));
    Promise.all([dashboardRequest, servicesRequest]).catch(() => undefined);
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
      <header className="fixed inset-x-0 top-0 z-30 border-b border-gray-200 bg-white">
        <div className="flex h-20 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3"><button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100" aria-label="Toggle services menu">{sidebarOpen ? <X /> : <Menu />}</button><Link to="/" className="text-xl font-bold tracking-tight text-gray-900">HD <span className="text-orange-500">MONKS</span></Link></div>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </header>
      <aside className={`fixed bottom-0 left-0 top-20 z-20 w-72 overflow-y-auto border-r border-gray-200 bg-white p-5 transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Your services</p>
        <nav className="mt-4 space-y-1">{services.map((service) => <Link key={service.service_id} to={`/dashboard/services/${service.service_id}`} onClick={() => setSidebarOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600">{service.name}</Link>)}</nav>
        {services.length === 0 && <p className="mt-4 text-sm text-gray-500">No services are available yet.</p>}
      </aside>
      <main className="ml-0 min-h-screen pt-20 md:ml-72">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
