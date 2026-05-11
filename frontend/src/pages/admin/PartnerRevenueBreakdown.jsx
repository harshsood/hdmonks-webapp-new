import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { ArrowLeft, Edit } from 'lucide-react';
import { toast, Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/admin`;

const getPartnerSharePercent = (category) => {
  const normalized = (category || '').toLowerCase();
  if (normalized.includes('both')) return 0.9;
  if (normalized.includes('execution')) return 0.8;
  if (normalized.includes('referral')) return 0.1;
  return 0.8;
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);

const PartnerRevenueBreakdown = () => {
  const { partnerId, clientId } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [partnersList, setPartnersList] = useState([]);
  const [serviceForm, setServiceForm] = useState({
    price: 0,
    referral_percent: 10,
    execution_percent: 80,
    admin_percent: 10,
    referral_partner_id: '',
    execution_partner_id: '',
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchPartner = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await axios.get(`${API}/partners/${partnerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPartner(res.data.data);
    } catch (error) {
      toast.error('Failed to load partner details');
    }
  }, [partnerId]);

  const fetchClients = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await axios.get(`${API}/partners/${partnerId}/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load clients');
    }
  }, [partnerId]);

  const fetchSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await axios.get(`${API}/partners/${partnerId}/revenue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(res.data.data);
    } catch (error) {
      toast.error('Failed to load revenue summary');
    }
  }, [partnerId]);

  const fetchPartners = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await axios.get(`${API}/partners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPartnersList(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load partner list');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPartner(), fetchClients(), fetchSummary(), fetchPartners()]);
      setLoading(false);
    };
    loadData();
  }, [fetchPartner, fetchClients, fetchSummary, fetchPartners]);

  useEffect(() => {
    if (clientId) {
      const filtered = clients.filter(client => client.id === clientId);
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [clients, clientId]);

  const openEditServiceModal = (client, service) => {
    const breakdown = service.breakdown_percentages || {
      referral_percent: 10,
      execution_percent: 80,
      admin_percent: 10
    };
    setEditingService({ client, service });
    setServiceForm({
      price: parseFloat(service.price) || 0,
      referral_percent: breakdown.referral_percent,
      execution_percent: breakdown.execution_percent,
      admin_percent: breakdown.admin_percent,
      referral_partner_id: client.referral_partner_id || '',
      execution_partner_id: client.execution_partner_id || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const total = parseFloat(serviceForm.referral_percent) +
                    parseFloat(serviceForm.execution_percent) +
                    parseFloat(serviceForm.admin_percent);
      if (Math.abs(total - 100) > 0.01) {
        toast.error('Percentages must add up to 100%');
        return;
      }

      const token = localStorage.getItem('admin_token');
      const clientId = editingService.client.id;
      const serviceId = editingService.service.id || editingService.service.service_id;
      const updatePayload = {
        price: parseFloat(serviceForm.price) || 0,
        breakdown_percentages: {
          referral_percent: parseFloat(serviceForm.referral_percent) || 0,
          execution_percent: parseFloat(serviceForm.execution_percent) || 0,
          admin_percent: parseFloat(serviceForm.admin_percent) || 0,
        }
      };

      if (serviceForm.referral_partner_id !== undefined) {
        updatePayload.referral_partner_id = serviceForm.referral_partner_id || null;
      }
      if (serviceForm.execution_partner_id !== undefined) {
        updatePayload.execution_partner_id = serviceForm.execution_partner_id || null;
      }

      await axios.put(
        `${API}/partners/${partnerId}/clients/${clientId}/services/${serviceId}`,
        updatePayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Service updated successfully');
      setIsEditModalOpen(false);
      setEditingService(null);
      await Promise.all([fetchClients(), fetchSummary()]);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Failed to update service');
    }
  };

  const calculateBreakdown = (price, breakdown) => {
    const referral = (price * (breakdown.referral_percent || 10)) / 100;
    const execution = (price * (breakdown.execution_percent || 80)) / 100;
    const admin = (price * (breakdown.admin_percent || 10)) / 100;
    return { referral, execution, admin };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const partnerSharePercent = getPartnerSharePercent(partner?.category);
  const partnerRevenue = (summary?.total_revenue || 0) * partnerSharePercent;
  const displayClients = clientId ? filteredClients : clients;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Revenue Breakdown</h1>
          <p className="text-gray-600">
            {clientId ? `Revenue breakdown for ${filteredClients[0]?.full_name || 'Client'}` : `Review and edit service prices and revenue shares for ${partner?.name || partner?.username || 'Partner'}.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-gray-600">Total Client Revenue</p>
          <p className="text-3xl font-bold mt-3 text-green-600">{formatCurrency(summary?.total_revenue ?? 0)}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600">Partner Share ({partnerSharePercent * 100}%)</p>
          <p className="text-3xl font-bold mt-3 text-teal-600">{formatCurrency(partnerRevenue)}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600">{clientId ? 'Selected Client' : 'Active Clients'}</p>
          <p className="text-3xl font-bold mt-3 text-blue-600">{displayClients.length}</p>
        </Card>
      </div>

      <div className="space-y-6">
        {displayClients.map((client) => {
          const clientTotal = (client.services || []).reduce((sum, service) => sum + (parseFloat(service.price) || 0), 0);
          const closedCost = parseFloat(client.closed_cost || 0);
          const displayTotal = closedCost > 0 ? Math.max(clientTotal, closedCost) : clientTotal;

          return (
            <Card key={client.id} className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{client.full_name}</h2>
                  <p className="text-sm text-gray-600">{client.email || ''}</p>
                  <p className="text-sm text-gray-600">{client.phone || ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Client Revenue</p>
                  <p className="text-2xl font-semibold text-green-700">{formatCurrency(displayTotal)}</p>
                  {closedCost > 0 && (
                    <p className="text-xs text-gray-500">Closed Cost applies</p>
                  )}
                </div>
              </div>

              {(client.services && client.services.length > 0) ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide">Service</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600 uppercase tracking-wide">Amount</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-600 uppercase tracking-wide">Referral</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-600 uppercase tracking-wide">Execution</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-600 uppercase tracking-wide">Admin</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600 uppercase tracking-wide">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {client.services.map((service) => {
                        const price = parseFloat(service.price) || 0;
                        const breakdown = service.breakdown_percentages || {
                          referral_percent: 10,
                          execution_percent: 80,
                          admin_percent: 10,
                        };
                        const { referral, execution, admin } = calculateBreakdown(price, breakdown);

                        return (
                          <tr key={service.id || service.service_id} className="hover:bg-gray-50">
                            <td className="px-3 py-3 align-top">
                              <div className="font-medium text-gray-900">{service.service_name || 'Service'}</div>
                              <div className="text-xs text-gray-500">{service.service_id || service.id || 'ID not available'}</div>
                            </td>
                            <td className="px-3 py-3 text-right text-gray-900">{formatCurrency(price)}</td>
                            <td className="px-3 py-3 text-center text-blue-700">
                              <div className="font-semibold">{breakdown.referral_percent}%</div>
                              <div className="text-xs text-blue-600">{formatCurrency(referral)}</div>
                            </td>
                            <td className="px-3 py-3 text-center text-green-700">
                              <div className="font-semibold">{breakdown.execution_percent}%</div>
                              <div className="text-xs text-green-600">{formatCurrency(execution)}</div>
                            </td>
                            <td className="px-3 py-3 text-center text-orange-700">
                              <div className="font-semibold">{breakdown.admin_percent}%</div>
                              <div className="text-xs text-orange-600">{formatCurrency(admin)}</div>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <Button variant="outline" size="sm" onClick={() => openEditServiceModal(client, service)}>
                                <Edit className="h-4 w-4 mr-2" />Edit
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No services added for this client.</p>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service Amount & Breakdown</DialogTitle>
          </DialogHeader>
          {editingService && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referral Partner</label>
                <select
                  value={serviceForm.referral_partner_id}
                  onChange={(e) => setServiceForm({ ...serviceForm, referral_partner_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Referral Partner (optional)</option>
                  {partnersList.map((p) => (
                    <option key={p.id} value={p.id}>{p.name || p.username} ({p.category})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Execution Partner</label>
                <select
                  value={serviceForm.execution_partner_id}
                  onChange={(e) => setServiceForm({ ...serviceForm, execution_partner_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Execution Partner (optional)</option>
                  {partnersList.map((p) => (
                    <option key={p.id} value={p.id}>{p.name || p.username} ({p.category})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setServiceForm({
                    ...serviceForm,
                    execution_partner_id: serviceForm.referral_partner_id,
                  })}
                  className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Use referral partner as execution
                </button>
                <button
                  type="button"
                  onClick={() => setServiceForm({
                    ...serviceForm,
                    referral_partner_id: serviceForm.execution_partner_id,
                    execution_partner_id: serviceForm.referral_partner_id,
                  })}
                  className="px-3 py-2 text-sm font-medium text-white bg-slate-600 rounded-lg hover:bg-slate-700"
                >
                  Swap referral/execution partners
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referral (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={serviceForm.referral_percent}
                  onChange={(e) => setServiceForm({ ...serviceForm, referral_percent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Execution (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={serviceForm.execution_percent}
                  onChange={(e) => setServiceForm({ ...serviceForm, execution_percent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={serviceForm.admin_percent}
                  onChange={(e) => setServiceForm({ ...serviceForm, admin_percent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-500">
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" richColors />
    </div>
  );
};

export default PartnerRevenueBreakdown;
