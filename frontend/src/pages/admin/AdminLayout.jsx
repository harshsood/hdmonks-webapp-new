import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  LayoutDashboard,
  Briefcase,
  Layers,
  Mail,
  Calendar,
  Clock,
  Star,
  FileText,
  HelpCircle,
  Package,
  MessageSquare,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/button';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/services', icon: Briefcase, label: 'Services' },
    { path: '/admin/stages', icon: Layers, label: 'Stages' },
    { path: '/admin/inquiries', icon: Mail, label: 'Inquiries' },
    { path: '/admin/bookings', icon: Calendar, label: 'Bookings' },
    { path: '/admin/timeslots', icon: Clock, label: 'Time Slots' },
    { path: '/admin/testimonials', icon: Star, label: 'Testimonials' },
    { path: '/admin/blogs', icon: FileText, label: 'Blog' },
    { path: '/admin/faqs', icon: HelpCircle, label: 'FAQs' },
    { path: '/admin/packages', icon: Package, label: 'Packages' },
    { path: '/admin/templates', icon: MessageSquare, label: 'Email Templates' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
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
              <span className="ml-3 text-xl font-bold text-gray-900">Admin Panel</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, <strong>{admin?.username}</strong>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
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
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-orange-600' : 'text-gray-500'}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
