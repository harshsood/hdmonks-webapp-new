import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  Users,
  X,
} from 'lucide-react';
import { useHRMSAuth } from '../../contexts/HRMSAuthContext';

const navigation = [
  { path: '/hrms/dashboard', label: 'Dashboard', permission: 'hrms.access', icon: LayoutDashboard },
  { path: '/hrms/employees', label: 'Employees', permission: 'employees.view', icon: Users },
  { path: '/hrms/organization', label: 'Organization', permission: 'organization.view', icon: Building2 },
  { path: '/hrms/attendance', label: 'Attendance', permission: 'attendance.view', icon: CalendarCheck2 },
  { path: '/hrms/leave', label: 'Leave', permission: 'leave.view', icon: ClipboardList },
  { path: '/hrms/salary', label: 'Salary', permission: 'hrms.access', icon: DollarSign },
  { path: '/hrms/roles', label: 'Roles & Access', permission: 'settings.manage', icon: Settings2 },
];

const pageTitles = {
  '/hrms': 'Dashboard',
  '/hrms/dashboard': 'Dashboard',
  '/hrms/employees': 'Employees',
  '/hrms/organization': 'Organization Management',
  '/hrms/attendance': 'Attendance',
  '/hrms/leave': 'Leave Management',
  '/hrms/leave/apply': 'Apply Leave',
  '/hrms/leave/balance': 'Leave Balance',
  '/hrms/leave/calendar': 'Leave Calendar',
  '/hrms/salary': 'Salary Management',
  '/hrms/roles': 'Roles & Access',
};

const HRMSLayout = () => {
  const { user, roles, logout, hasPermission } = useHRMSAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleNavigation = navigation.filter((item) => {
    if (item.path === '/hrms/salary') return hasPermission('salary.view') || roles.includes('employee');
    return hasPermission(item.permission);
  });
  const currentTitle = pageTitles[location.pathname] || (location.pathname.endsWith('/new') ? 'New Employee' : location.pathname.endsWith('/edit') ? 'Edit Employee' : location.pathname.includes('/employees/') ? 'Employee Profile' : 'HRMS');

  const handleLogout = async () => {
    await logout();
    navigate('/hrms/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-gray-200 bg-white">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { setSidebarOpen((open) => !open); setMobileOpen(false); }} className="hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:block" aria-label="Toggle HRMS sidebar">
              {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
            <button type="button" onClick={() => setMobileOpen((open) => !open)} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden" aria-label="Open HRMS navigation">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/hrms/dashboard" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-sm font-bold text-white">H</span>
              <span className="hidden text-sm font-bold tracking-wide text-gray-900 sm:inline">HD MONKS</span>
              <span className="hidden text-sm text-gray-400 sm:inline">/</span>
              <span className="text-sm font-semibold text-orange-600">HRMS</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-sm font-semibold text-gray-900">{user?.full_name || 'HRMS User'}</p><p className="text-xs text-gray-500">{roles.map((role) => role.replace('_', ' ')).join(', ')}</p></div>
            <button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Log out</span></button>
          </div>
        </div>
      </header>

      {mobileOpen && <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-20 bg-gray-900/20 md:hidden" />}
      <aside className={`fixed bottom-0 left-0 top-16 z-30 border-r border-gray-200 bg-white transition-all duration-200 md:translate-x-0 ${sidebarOpen ? 'w-64' : 'w-16'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex h-full flex-col p-3">
          <div className={`mb-4 px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-400 ${!sidebarOpen ? 'text-center' : ''}`}>{sidebarOpen ? 'HRMS workspace' : 'HR'}</div>
          <nav className="space-y-1">{visibleNavigation.map((item) => { const Icon = item.icon; const active = location.pathname === item.path || (item.path !== '/hrms/dashboard' && location.pathname.startsWith(`${item.path}/`)); return <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} title={!sidebarOpen ? item.label : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${!sidebarOpen ? 'justify-center' : ''}`}><Icon className={`h-5 w-5 shrink-0 ${active ? 'text-orange-600' : 'text-gray-400'}`} />{sidebarOpen && <span>{item.label}</span>}</Link>; })}</nav>
          <div className="mt-auto border-t border-gray-100 pt-3"><p className={`px-3 text-xs text-gray-400 ${!sidebarOpen ? 'text-center' : ''}`}>{sidebarOpen ? 'Secure HR workspace' : 'Secure'}</p></div>
        </div>
      </aside>

      <main className={`min-h-screen pt-16 transition-all duration-200 ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
        <div className="border-b border-gray-200 bg-white px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><p className="text-xs font-semibold uppercase tracking-wider text-orange-600">HRMS</p><h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{currentTitle}</h1></div></div>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"><Outlet /></div>
      </main>
    </div>
  );
};

export default HRMSLayout;