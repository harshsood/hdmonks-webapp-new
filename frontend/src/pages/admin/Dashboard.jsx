import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { 
  Briefcase, Mail, Calendar, TrendingUp,
  Users, CheckCircle, Clock, XCircle 
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/admin`;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Services',
      value: stats?.total_services || 0,
      icon: Briefcase,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Inquiries',
      value: stats?.total_inquiries || 0,
      icon: Mail,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Total Bookings',
      value: stats?.total_bookings || 0,
      icon: Calendar,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Pending Inquiries',
      value: stats?.inquiry_stats?.new || 0,
      icon: Clock,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your business management platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-3xl font-bold mt-2 ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 ${stat.color} rounded-full bg-opacity-10`}>
                  <Icon className={`h-8 w-8 ${stat.textColor}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inquiry Stats */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Inquiry Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">New</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">
                {stats?.inquiry_stats?.new || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Contacted</span>
              </div>
              <span className="text-xl font-bold text-blue-600">
                {stats?.inquiry_stats?.contacted || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Closed</span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {stats?.inquiry_stats?.closed || 0}
              </span>
            </div>
          </div>
        </Card>

        {/* Booking Stats */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Confirmed</span>
              </div>
              <span className="text-xl font-bold text-blue-600">
                {stats?.booking_stats?.confirmed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-medium">Completed</span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {stats?.booking_stats?.completed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium">Cancelled</span>
              </div>
              <span className="text-xl font-bold text-red-600">
                {stats?.booking_stats?.cancelled || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Inquiries */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Inquiries</h2>
          <div className="space-y-3">
            {stats?.recent_inquiries && stats.recent_inquiries.length > 0 ? (
              stats.recent_inquiries.map((inquiry) => (
                <div key={inquiry.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{inquiry.full_name}</p>
                      <p className="text-sm text-gray-600">{inquiry.email}</p>
                      <p className="text-xs text-gray-500 mt-1">{inquiry.business_type}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      inquiry.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                      inquiry.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {inquiry.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent inquiries</p>
            )}
          </div>
        </Card>

        {/* Recent Bookings */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Bookings</h2>
          <div className="space-y-3">
            {stats?.recent_bookings && stats.recent_bookings.length > 0 ? (
              stats.recent_bookings.map((booking) => (
                <div key={booking.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{booking.full_name}</p>
                      <p className="text-sm text-gray-600">{booking.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {booking.date} at {booking.time}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent bookings</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
