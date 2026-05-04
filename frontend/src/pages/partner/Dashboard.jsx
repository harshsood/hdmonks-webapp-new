import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { usePartnerAuth } from '../../contexts/PartnerAuthContext';
import { Card } from '../../components/ui/card';
import { Popover, PopoverTrigger, PopoverContent } from '../../components/ui/popover';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, FileText, DollarSign, AlertCircle, Info } from 'lucide-react';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const { token, partner } = usePartnerAuth();
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const getPartnerSharePercent = (category) => {
    const normalized = (category || '').toLowerCase();
    if (normalized.includes('both')) return 0.9;
    if (normalized.includes('execution')) return 0.8;
    if (normalized.includes('referral')) return 0.1;
    return 0.8;
  };

  const getPartnerShareLabel = (category) => {
    const normalized = (category || '').toLowerCase();
    if (normalized.includes('both')) return 'Referral + Execution Share';
    if (normalized.includes('execution')) return 'Execution Partner Share';
    if (normalized.includes('referral')) return 'Referral Partner Share';
    return 'Execution Partner Share';
  };

  const partnerSharePercent = getPartnerSharePercent(partner?.category);
  const partnerShareLabel = getPartnerShareLabel(partner?.category);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND}/api/partner/revenue`, { headers: { Authorization: `Bearer ${token}` } });
      setSummary(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Monitor your business performance and revenue</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tentative Cost</p>
              <p className="text-3xl font-bold mt-2 text-green-600">{formatCurrency(summary?.total_revenue ?? 0)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
              <p className="text-3xl font-bold mt-2 text-blue-600">{summary?.by_client?.length ?? 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Per Client</p>
              <p className="text-3xl font-bold mt-2 text-purple-600">
                {formatCurrency(summary?.by_client?.length > 0 ? summary?.total_revenue / summary?.by_client?.length : 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-3xl font-bold mt-2 text-orange-600">{summary?.by_client?.length ?? 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="text-gray-400 hover:text-gray-700">
                      <Info className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-3">
                    <p className="text-sm font-semibold text-gray-900">Income split details</p>
                    <p className="text-sm text-gray-700 mt-2">Split of total revenue across referral, execution and admin shares.</p>
                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span>Referral Partner (10%)</span>
                        <span className="font-semibold">{formatCurrency((summary?.total_revenue ?? 0) * 0.1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Execution Partner (80%)</span>
                        <span className="font-semibold">{formatCurrency((summary?.total_revenue ?? 0) * 0.8)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Admin (10%)</span>
                        <span className="font-semibold">{formatCurrency((summary?.total_revenue ?? 0) * 0.1)}</span>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-3xl font-bold mt-2 text-teal-600">{formatCurrency((summary?.total_revenue ?? 0) * partnerSharePercent)}</p>
              <div className="mt-3 text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Your share</span>
                  <span className="font-semibold">{formatCurrency((summary?.total_revenue ?? 0) * partnerSharePercent)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Admin share</span>
                  <span className="font-semibold">{formatCurrency((summary?.total_revenue ?? 0) * 0.1)}</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-teal-100 rounded-full">
              <DollarSign className="h-8 w-8 text-teal-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue by Client</h2>
          {summary?.by_client?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary?.by_client || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="client_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Distribution</h2>
          {summary?.by_client?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={summary?.by_client || []}
                  dataKey="amount"
                  nameKey="client_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                >
                  {(summary?.by_client || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899'][index % 6]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Client Revenue Details</h2>
        {summary?.by_client?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Client Name</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Revenue</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {summary?.by_client?.map(c => (
                  <tr key={c.client_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{c.client_name}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">₹{c.amount}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {summary?.total_revenue > 0 ? ((c.amount / summary?.total_revenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>No clients added yet</span>
          </div>
        )}
      </Card>

    </div>
  );
};

export default Dashboard;
