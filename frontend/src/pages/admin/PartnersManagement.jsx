import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Popover, PopoverTrigger, PopoverContent } from '../../components/ui/popover';
import { Plus, Trash2, Edit, Users, User, Info } from 'lucide-react';
import { toast, Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/admin`;

const PartnersManagement = () => {
  const [partners, setPartners] = useState({ execution: [], referral: [], both: [] });
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [clients, setClients] = useState([]);
  const [partnerRevenues, setPartnerRevenues] = useState({});
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClientForSplits, setSelectedClientForSplits] = useState(null);
  const [isSplitsModalOpen, setIsSplitsModalOpen] = useState(false);
  const [editingServiceBreakdown, setEditingServiceBreakdown] = useState(null);
  const [isEditBreakdownModalOpen, setIsEditBreakdownModalOpen] = useState(false);
  const [breakdownFormData, setBreakdownFormData] = useState({
    referral_percent: 10,
    execution_percent: 80,
    admin_percent: 10
  });
  const [partnerFormData, setPartnerFormData] = useState({
    username: '', email: '', password: '', name: '', phone: '', category: 'execution'
  });
  const [clientFormData, setClientFormData] = useState({
    full_name: '', email: '', phone: '', company: '', closed_cost: 0
  });

  const fetchPartners = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const [executionRes, referralRes, bothRes] = await Promise.all([
        axios.get(`${API}/partners?category=execution`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/partners?category=referral`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/partners?category=both`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setPartners({
        execution: executionRes.data.data || [],
        referral: referralRes.data.data || [],
        both: bothRes.data.data || []
      });
      
      // Fetch revenue for all partners
      const allPartners = [...(executionRes.data.data || []), ...(referralRes.data.data || []), ...(bothRes.data.data || [])];
      const revenuePromises = allPartners.map(async (partner) => {
        try {
          const revenueRes = await axios.get(`${API}/partners/${getId(partner)}/revenue`, { headers: { Authorization: `Bearer ${token}` } });
          return { partnerId: getId(partner), revenue: revenueRes.data.data?.total_revenue || 0 };
        } catch (error) {
          return { partnerId: getId(partner), revenue: 0 };
        }
      });
      
      const revenues = await Promise.all(revenuePromises);
      const revenueMap = {};
      revenues.forEach(({ partnerId, revenue }) => {
        revenueMap[partnerId] = revenue;
      });
      setPartnerRevenues(revenueMap);
    } catch (error) {
      toast.error('Failed to load partners');
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const fetchClients = async (partnerId) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/partners/${partnerId}/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load clients');
    }
  };

  const getId = (item) => item?.id || item?._id;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const getClientClosedCost = (client) => {
    const serviceTotal = (client.services || []).reduce(
      (sum, service) => sum + (parseFloat(service.price) || 0),
      0
    );
    return client?.closed_cost > 0 ? client.closed_cost : serviceTotal > 0 ? serviceTotal : 0;
  };

  const getClosedCostSplits = (amount) => ({
    referralShare: amount * 0.1,
    executionShare: amount * 0.8,
    adminShare: amount * 0.1,
  });

  const getServiceBreakdown = (service) => {
    const price = parseFloat(service.price) || 0;
    const breakdown = service.breakdown_percentages || {
      referral_percent: 10,
      execution_percent: 80,
      admin_percent: 10
    };
    return {
      referralShare: (price * breakdown.referral_percent) / 100,
      executionShare: (price * breakdown.execution_percent) / 100,
      adminShare: (price * breakdown.admin_percent) / 100,
      breakdown
    };
  };

  const openEditBreakdownModal = (client, service) => {
    setEditingServiceBreakdown({ client, service });
    const breakdown = service.breakdown_percentages || {
      referral_percent: 10,
      execution_percent: 80,
      admin_percent: 10
    };
    setBreakdownFormData(breakdown);
    setIsEditBreakdownModalOpen(true);
  };

  const handleBreakdownSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate percentages add up to 100
      const total = parseFloat(breakdownFormData.referral_percent) + 
                    parseFloat(breakdownFormData.execution_percent) + 
                    parseFloat(breakdownFormData.admin_percent);
      
      if (Math.abs(total - 100) > 0.01) {
        toast.error('Percentages must add up to 100%');
        return;
      }

      const token = localStorage.getItem('admin_token');
      const partnerId = getId(selectedPartner);
      const clientId = getId(editingServiceBreakdown.client);
      const service = editingServiceBreakdown.service;
      
      // Use service_id, service_name and price as composite key for more reliable identification
      const breakdownPayload = {
        ...breakdownFormData,
        service_identifier: {
          service_id: service.service_id,
          service_name: service.service_name,
          price: service.price
        }
      };

      console.log('Sending breakdown update:', breakdownPayload);

      await axios.put(
        `${API}/partners/${partnerId}/clients/${clientId}/breakdown-update`,
        breakdownPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Breakdown updated');
      setIsEditBreakdownModalOpen(false);
      fetchClients(partnerId);
      setEditingServiceBreakdown(null);
    } catch (error) {
      console.error('Breakdown update error:', error.response?.data || error.message);
      toast.error(error.response?.data?.detail || 'Failed to update breakdown');
    }
  };

  const handlePartnerSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      if (editingPartner) {
        await axios.put(`${API}/partners/${getId(editingPartner)}`, partnerFormData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Partner updated');
      } else {
        await axios.post(`${API}/partners`, partnerFormData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Partner added');
      }
      setIsPartnerModalOpen(false);
      fetchPartners();
      setPartnerFormData({ username: '', email: '', password: '', name: '', phone: '', category: 'execution' });
      setEditingPartner(null);
    } catch (error) {
      toast.error('Failed to save partner');
    }
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      const partnerId = getId(selectedPartner);
      const clientId = getId(editingClient);
      if (editingClient) {
        await axios.put(`${API}/partners/${partnerId}/clients/${clientId}`, clientFormData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Client updated');
      } else {
        await axios.post(`${API}/partners/${partnerId}/clients`, clientFormData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Client added');
      }
      setIsClientModalOpen(false);
      fetchClients(partnerId);
      setClientFormData({ full_name: '', email: '', phone: '', company: '', closed_cost: 0 });
      setEditingClient(null);
    } catch (error) {
      toast.error('Failed to save client');
    }
  };

  const handleDeletePartner = async (partner) => {
    if (!confirm(`Delete partner ${partner.name || partner.username}?`)) return;
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/partners/${getId(partner)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Partner deleted');
      fetchPartners();
    } catch (error) {
      toast.error('Failed to delete partner');
    }
  };

  const handleDeleteClient = async (client) => {
    if (!confirm(`Delete client ${client.full_name}?`)) return;
    try {
      const token = localStorage.getItem('admin_token');
      const partnerId = getId(selectedPartner);
      await axios.delete(`${API}/partners/${partnerId}/clients/${getId(client)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Client deleted');
      fetchClients(partnerId);
    } catch (error) {
      toast.error('Failed to delete client');
    }
  };

  const openPartnerModal = (partner = null) => {
    if (partner) {
      setEditingPartner(partner);
      setPartnerFormData({
        username: partner.username,
        email: partner.email,
        password: '',
        name: partner.name || '',
        phone: partner.phone || '',
        category: partner.category
      });
    } else {
      setPartnerFormData({ username: '', email: '', password: '', name: '', phone: '', category: 'execution' });
      setEditingPartner(null);
    }
    setIsPartnerModalOpen(true);
  };

  const openClientModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setClientFormData({
        full_name: client.full_name,
        email: client.email || '',
        phone: client.phone || '',
        company: client.company || '',
        closed_cost: client.closed_cost || 0
      });
    } else {
      setClientFormData({ full_name: '', email: '', phone: '', company: '', closed_cost: 0 });
      setEditingClient(null);
    }
    setIsClientModalOpen(true);
  };

  const selectPartner = (partner) => {
    setSelectedPartner(partner);
    fetchClients(getId(partner));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Partners Management</h1>
        <Button onClick={() => openPartnerModal()} className="bg-orange-500">
          <Plus className="h-5 w-5 mr-2" />Add Partner
        </Button>
      </div>

      <Tabs defaultValue="execution" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="execution">Execution Partners</TabsTrigger>
          <TabsTrigger value="referral">Referral Partners</TabsTrigger>
          <TabsTrigger value="both">Both Partners</TabsTrigger>
        </TabsList>

        {['execution', 'referral', 'both'].map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            {!selectedPartner || selectedPartner.category !== category ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {partners[category].map(partner => (
                  <Card key={getId(partner)} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => selectPartner(partner)}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-orange-500" />
                        <h3 className="font-semibold">{partner.name || partner.username}</h3>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openPartnerModal(partner); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeletePartner(partner); }}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{partner.email}</p>
                    {partner.phone && <p className="text-sm text-gray-600">{partner.phone}</p>}
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      Total Revenue: ₹{partnerRevenues[getId(partner)] || 0}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => setSelectedPartner(null)}>
                    ← Back to Partners
                  </Button>
                  <h2 className="text-xl font-semibold">Clients of {selectedPartner.name || selectedPartner.username}</h2>
                  <Button onClick={() => openClientModal()} className="bg-orange-500 ml-auto">
                    <Plus className="h-4 w-4 mr-2" />Add Client
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clients.map(client => (
                    <Card key={getId(client)} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-500" />
                          <h3 className="font-semibold">{client.full_name}</h3>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openClientModal(client)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteClient(client)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                      {client.email && <p className="text-sm text-gray-600">{client.email}</p>}
                      {client.phone && <p className="text-sm text-gray-600">{client.phone}</p>}
                      {client.company && <p className="text-sm text-gray-600">{client.company}</p>}
                      {(() => {
                        const clientClosedCost = getClientClosedCost(client);
                        if (clientClosedCost <= 0) return null;
                        
                        // Show breakdown based on services or closed cost
                        const hasServices = client.services && client.services.length > 0;
                        
                        return (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                            <span>Closed Cost:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(clientClosedCost)}</span>
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                >
                                  <Info className="h-4 w-4" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[600px] p-6 max-h-[600px] overflow-y-auto">
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900">Revenue Breakdown</h3>
                                      <p className="text-sm text-gray-500">Each row is one service.</p>
                                    </div>
                                    <span className="text-sm text-gray-500">Total: {formatCurrency(clientClosedCost)}</span>
                                  </div>

                                  {hasServices ? (
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
                                          {client.services.map((service, idx) => {
                                            const servicePrice = parseFloat(service.price) || 0;
                                            if (servicePrice <= 0) return null;

                                            const { referralShare, executionShare, adminShare, breakdown } = getServiceBreakdown(service);
                                            return (
                                              <tr key={service.id || idx}>
                                                <td className="px-3 py-3 align-top">
                                                  <div className="font-medium text-gray-900">{service.service_name || 'Service'}</div>
                                                  <div className="text-xs text-gray-500">{service.service_id || 'N/A'}</div>
                                                </td>
                                                <td className="px-3 py-3 text-right text-gray-900">{formatCurrency(servicePrice)}</td>
                                                <td className="px-3 py-3 text-center text-blue-700">
                                                  <div className="font-semibold">{breakdown.referral_percent}%</div>
                                                  <div className="text-xs text-blue-600">{formatCurrency(referralShare)}</div>
                                                </td>
                                                <td className="px-3 py-3 text-center text-green-700">
                                                  <div className="font-semibold">{breakdown.execution_percent}%</div>
                                                  <div className="text-xs text-green-600">{formatCurrency(executionShare)}</div>
                                                </td>
                                                <td className="px-3 py-3 text-center text-orange-700">
                                                  <div className="font-semibold">{breakdown.admin_percent}%</div>
                                                  <div className="text-xs text-orange-600">{formatCurrency(adminShare)}</div>
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                  <button
                                                    onClick={() => openEditBreakdownModal(client, service)}
                                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                                                  >
                                                    Edit %
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                                      <div className="flex items-center justify-between mb-3">
                                        <span>Referral</span>
                                        <span className="font-semibold text-blue-700">10%</span>
                                      </div>
                                      <div className="flex items-center justify-between mb-3">
                                        <span>Execution</span>
                                        <span className="font-semibold text-green-700">80%</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span>Admin</span>
                                        <span className="font-semibold text-orange-700">10%</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        );
                      })()}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Partner Modal */}
      <Dialog open={isPartnerModalOpen} onOpenChange={setIsPartnerModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPartner ? 'Edit Partner' : 'Add Partner'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePartnerSubmit} className="space-y-4">
            <select
              value={partnerFormData.category}
              onChange={e => setPartnerFormData({...partnerFormData, category: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="execution">Execution Partner</option>
              <option value="referral">Referral Partner</option>
              <option value="both">Both Referral and Execution Partner</option>
            </select>
            <input
              type="text"
              placeholder="Username"
              value={partnerFormData.username}
              onChange={e => setPartnerFormData({...partnerFormData, username: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={partnerFormData.email}
              onChange={e => setPartnerFormData({...partnerFormData, email: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            {!editingPartner && (
              <input
                type="password"
                placeholder="Password"
                value={partnerFormData.password}
                onChange={e => setPartnerFormData({...partnerFormData, password: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            )}
            <input
              type="text"
              placeholder="Name"
              value={partnerFormData.name}
              onChange={e => setPartnerFormData({...partnerFormData, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={partnerFormData.phone}
              onChange={e => setPartnerFormData({...partnerFormData, phone: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <Button type="submit" className="w-full bg-orange-500">
              {editingPartner ? 'Update Partner' : 'Add Partner'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Client Modal */}
      <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add Client'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleClientSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={clientFormData.full_name}
              onChange={e => setClientFormData({...clientFormData, full_name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={clientFormData.email}
              onChange={e => setClientFormData({...clientFormData, email: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={clientFormData.phone}
              onChange={e => setClientFormData({...clientFormData, phone: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Company"
              value={clientFormData.company}
              onChange={e => setClientFormData({...clientFormData, company: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <Button type="submit" className="w-full bg-orange-500">
              {editingClient ? 'Update Client' : 'Add Client'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Revenue Splits Modal */}
      <Dialog open={isSplitsModalOpen} onOpenChange={setIsSplitsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revenue Distribution - {selectedClientForSplits?.full_name}</DialogTitle>
          </DialogHeader>
          {selectedClientForSplits && (() => {
            const tentativeCost = (selectedClientForSplits.services || []).reduce(
              (sum, service) => sum + (parseFloat(service.price) || 0),
              0
            );
            const closedCostAmount = selectedClientForSplits.closed_cost > 0 ? selectedClientForSplits.closed_cost : tentativeCost;
            const { referralShare, executionShare, adminShare } = getClosedCostSplits(closedCostAmount);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">Closed Cost</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(closedCostAmount)}</p>
                  </div>
                  {selectedClientForSplits.closed_cost <= 0 && tentativeCost > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-500">Service Total</p>
                      <p className="text-2xl font-semibold text-orange-600">{formatCurrency(tentativeCost)}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Referral Partner (10%)</span>
                    <span className="font-bold text-blue-600">{formatCurrency(referralShare)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Execution Partner (80%)</span>
                    <span className="font-bold text-green-600">{formatCurrency(executionShare)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">HD Monks (10%)</span>
                    <span className="font-bold text-orange-600">{formatCurrency(adminShare)}</span>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-600 mt-4">
                  Distribution based on the closed cost amount
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit Breakdown Percentages Modal */}
      <Dialog open={isEditBreakdownModalOpen} onOpenChange={setIsEditBreakdownModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Breakdown - {editingServiceBreakdown?.service?.service_name || 'Service'}
            </DialogTitle>
          </DialogHeader>
          {editingServiceBreakdown && (() => {
            const service = editingServiceBreakdown.service;
            const servicePrice = parseFloat(service.price) || 0;
            const calculatedBreakdown = {
              referralShare: (servicePrice * breakdownFormData.referral_percent) / 100,
              executionShare: (servicePrice * breakdownFormData.execution_percent) / 100,
              adminShare: (servicePrice * breakdownFormData.admin_percent) / 100
            };
            const total = parseFloat(breakdownFormData.referral_percent) + 
                          parseFloat(breakdownFormData.execution_percent) + 
                          parseFloat(breakdownFormData.admin_percent);
            const totalValid = Math.abs(total - 100) < 0.01;

            return (
              <div className="space-y-4">
                {/* Service Amount Display */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Service Amount</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(servicePrice)}</p>
                </div>

                {/* Percentage Inputs */}
                <form onSubmit={handleBreakdownSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Referral Partner (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={breakdownFormData.referral_percent}
                      onChange={(e) => setBreakdownFormData({...breakdownFormData, referral_percent: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <p className="text-xs text-blue-600 mt-1">₹{formatCurrency(calculatedBreakdown.referralShare)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Execution Partner (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={breakdownFormData.execution_percent}
                      onChange={(e) => setBreakdownFormData({...breakdownFormData, execution_percent: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <p className="text-xs text-green-600 mt-1">₹{formatCurrency(calculatedBreakdown.executionShare)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin - HD Monks (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={breakdownFormData.admin_percent}
                      onChange={(e) => setBreakdownFormData({...breakdownFormData, admin_percent: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <p className="text-xs text-orange-600 mt-1">₹{formatCurrency(calculatedBreakdown.adminShare)}</p>
                  </div>

                  {/* Total Validation */}
                  <div className={`p-3 rounded-lg ${totalValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`text-sm font-semibold ${totalValid ? 'text-green-700' : 'text-red-700'}`}>
                      Total: {total.toFixed(2)}% {totalValid ? '✓' : '(Must equal 100%)'}
                    </p>
                  </div>

                  {/* Breakdown Summary */}
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700">Distribution Preview:</p>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div className="flex justify-between">
                        <span>Referral</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(calculatedBreakdown.referralShare)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Execution</span>
                        <span className="font-semibold text-green-600">{formatCurrency(calculatedBreakdown.executionShare)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Admin</span>
                        <span className="font-semibold text-orange-600">{formatCurrency(calculatedBreakdown.adminShare)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditBreakdownModalOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-orange-500" disabled={!totalValid}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" richColors />
    </div>
  );
};

export default PartnersManagement;