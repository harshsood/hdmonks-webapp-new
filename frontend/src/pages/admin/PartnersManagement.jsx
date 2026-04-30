import React, { useState, useEffect } from 'react';
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
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [partnerFormData, setPartnerFormData] = useState({
    username: '', email: '', password: '', name: '', phone: '', category: 'execution'
  });
  const [clientFormData, setClientFormData] = useState({
    full_name: '', email: '', phone: '', company: ''
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
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
    } catch (error) {
      toast.error('Failed to load partners');
    }
  };

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
      setClientFormData({ full_name: '', email: '', phone: '', company: '' });
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
        company: client.company || ''
      });
    } else {
      setClientFormData({ full_name: '', email: '', phone: '', company: '' });
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
            <Button type="submit" className="w-full bg-orange-500">
              {editingClient ? 'Update Client' : 'Add Client'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default PartnersManagement;