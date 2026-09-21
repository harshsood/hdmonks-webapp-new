import React from 'react';
import { Link } from 'react-router-dom';
import { useHRMSAuth } from '../../contexts/HRMSAuthContext';

const HRMSDashboard = () => {
  const { user, hasPermission } = useHRMSAuth();

  return (
    <section className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">Secure HR workspace</p>
        <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.full_name?.split(' ')[0] || 'User'}.</h2>
        <p className="max-w-2xl text-gray-600">Your HRMS access is active. Use the navigation to work with the HR areas available to your role.</p>
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-800">
          <p className="font-semibold">Access verified</p>
          <p className="mt-1 text-sm">This session is authorized with the <span className="font-mono">hrms.access</span> permission.</p>
        </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hasPermission('employees.view') && <Link to="/hrms/employees" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-orange-300"><p className="font-semibold text-gray-900">Employees</p><p className="mt-1 text-sm text-gray-500">View and manage employee records.</p></Link>}
        {hasPermission('attendance.view') && <Link to="/hrms/attendance" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-orange-300"><p className="font-semibold text-gray-900">Attendance</p><p className="mt-1 text-sm text-gray-500">Track attendance and corrections.</p></Link>}
        {hasPermission('leave.view') && <Link to="/hrms/leave" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-orange-300"><p className="font-semibold text-gray-900">Leave</p><p className="mt-1 text-sm text-gray-500">Manage leave requests and balances.</p></Link>}
      </div>
    </section>
  );
};

export default HRMSDashboard;
