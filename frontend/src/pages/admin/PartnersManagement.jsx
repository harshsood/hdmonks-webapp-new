import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Plus, Trash2, Edit, Users, User } from 'lucide-react';
import { toast, Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/admin`;

const PartnersManagement = () => {
  const [partners, setPartners] = useState({ execution: [], referral: [] });
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [clients, setClients] = useState([]);
  const [partnerRevenues, setPartnerRevenues] = useState({});
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClientForSplits, setSelectedClientForSplits] = useState(null);
  const [isSplitsModalOpen, setIsSplitsModalOpen] = useState(false);
  const [partnerFormData, setPartnerFormData] = useState({
    username: '', email: '', password: '', name: '', phone: '', category: 'execution'
  });
  const [clientFormData, setClientFormData] = useState({
    full_name: '', email: '', phone: '', company: '', closed_cost: 0
  });

  const fetchPartners = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const [executionRes, referralRes] = await Promise.all([
        axios.get(`${API}/partners?category=execution`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/partners?category=referral`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setPartners({
        execution: executionRes.data.data || [],
        referral: referralRes.data.data || []
      });
      
      // Fetch revenue for all partners
      const allPartners = [...(executionRes.data.data || []), ...(referralRes.data.data || [])];
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="execution">Execution Partners</TabsTrigger>
          <TabsTrigger value="referral">Referral Partners</TabsTrigger>
        </TabsList>

        {['execution', 'referral'].map(category => (
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
                      {client.closed_cost && client.closed_cost > 0 && (
                        <p className="text-sm text-gray-600">
                          Closed Cost: <span 
                            className="font-semibold text-green-600 cursor-pointer hover:underline"
                            onClick={() => {
                              setSelectedClientForSplits(client);
                              setIsSplitsModalOpen(true);
                            }}
                          >
                            ₹{client.closed_cost}
                          </span>
                        </p>
                      )}
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
            <input
              type="number"
              placeholder="Closed Cost"
              value={clientFormData.closed_cost}
              onChange={e => setClientFormData({...clientFormData, closed_cost: parseFloat(e.target.value) || 0})}
              className="w-full px-3 py-2 border rounded-lg"
              step="0.01"
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
            const referralShare = tentativeCost * 0.1;
            const executionShare = tentativeCost * 0.8;
            const hdMonksShare = tentativeCost * 0.1;
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">Closed Cost</p>
                    <p className="text-2xl font-semibold text-gray-900">₹{selectedClientForSplits.closed_cost}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">Tentative Cost</p>
                    <p className="text-2xl font-semibold text-orange-600">₹{tentativeCost.toFixed(2)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Referral Partner (10%):</span>
                    <span className="font-bold text-blue-600">₹{referralShare.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Execution Partner (80%):</span>
                    <span className="font-bold text-green-600">₹{executionShare.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">HD Monks (10%):</span>
                    <span className="font-bold text-orange-600">₹{hdMonksShare.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-600 mt-4">
                  Distribution based on the Tentative Cost amount
                </div>
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