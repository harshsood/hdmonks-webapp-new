import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/admin`;

const PackagesManagement = () => {
  const [packages, setPackages] = useState([]);
  const [stages, setStages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', services: [], price: 0, duration: '3 months',
    features: [''], popular: false, published: true
  });

  useEffect(() => {
    fetchPackages();
    fetchStages();
  }, []);

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/packages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPackages(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load packages');
    }
  };

  const fetchStages = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/stages`);
      setStages(response.data.data || []);
    } catch (error) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      const data = {...formData, features: formData.features.filter(f => f.trim())};
      
      if (editingPackage) {
        await axios.put(`${API}/packages/${editingPackage.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Package updated');
      } else {
        await axios.post(`${API}/packages`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Package created');
      }
      setIsModalOpen(false);
      fetchPackages();
      resetForm();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this package?')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/packages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Package deleted');
      fetchPackages();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const resetForm = () => {
    setEditingPackage(null);
    setFormData({ name: '', description: '', services: [], price: 0, duration: '3 months', features: [''], popular: false, published: true });
  };

  const openEditModal = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      services: pkg.services,
      price: pkg.price,
      duration: pkg.duration,
      features: pkg.features,
      popular: pkg.popular,
      published: pkg.published
    });
    setIsModalOpen(true);
  };

  const addFeature = () => {
    setFormData({...formData, features: [...formData.features, '']});
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({...formData, features: newFeatures});
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Service Packages</h1>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-orange-500">
          <Plus className="h-5 w-5 mr-2" />New Package
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map(pkg => (
          <Card key={pkg.id} className={`p-6 ${pkg.popular ? 'border-2 border-orange-500' : ''}`}>
            {pkg.popular && <div className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full w-fit mb-3">Popular</div>}
            <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <DollarSign className="h-6 w-6 text-orange-500" />
              <span className="text-4xl font-bold">{pkg.price}</span>
              <span className="text-gray-600">/{pkg.duration}</span>
            </div>
            <p className="text-gray-600 mb-4">{pkg.description}</p>
            <div className="space-y-2 mb-4">
              {pkg.features?.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-green-500">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => openEditModal(pkg)} className="flex-1">
                <Edit className="h-4 w-4 mr-1" />Edit
              </Button>
              <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(pkg.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPackage ? 'Edit Package' : 'New Package'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Package Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
            <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows="2" required />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Price" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" required />
              <input type="text" placeholder="Duration" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Features</label>
              {formData.features.map((feature, i) => (
                <input key={i} type="text" value={feature} onChange={e => updateFeature(i, e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2" placeholder={`Feature ${i+1}`} />
              ))}
              <Button type="button" size="sm" variant="outline" onClick={addFeature}>+ Add Feature</Button>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.popular} onChange={e => setFormData({...formData, popular: e.target.checked})} />
                <span>Mark as Popular</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.published} onChange={e => setFormData({...formData, published: e.target.checked})} />
                <span>Published</span>
              </label>
            </div>
            <Button type="submit" className="w-full bg-orange-500">{editingPackage ? 'Update' : 'Create'} Package</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PackagesManagement;
