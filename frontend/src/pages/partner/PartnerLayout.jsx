import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { usePartnerAuth } from '../../contexts/PartnerAuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const PartnerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { partner, logout } = usePartnerAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/partner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/partner/clients', icon: Users, label: 'Clients' },
    { path: '/partner/profile', icon: Settings, label: 'Profile' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/partner/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <img
                src="https://customer-assets.emergentagent.com/job_bizlaunch-guide-1/artifacts/7w27dsce_HD%20Monks%20%282%29.png"
                alt="HD MONKS"
                className="h-10 w-auto ml-4"
              />
              <span className="ml-3 text-xl font-bold text-gray-900">Partner Portal</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, <strong>{partner?.username}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md border border-red-300 text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 z-20 overflow-y-auto ${
          sidebarOpen ? 'w-64' : 'w-0'
        }`}
      >
        <nav className="px-3 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 pt-16 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8">
        <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PartnerLayout;
