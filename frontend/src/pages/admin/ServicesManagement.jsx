import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/admin`;

const ServicesManagement = () => {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    service_id: '',
    name: '',
    description: '',
    icon: 'Briefcase',
    relevant_for: ['startup', 'msme'],
    details: ''
  });

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${BACKEND_URL}/api/stages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStages(response.data.data);
        console.log('Stages fetched successfully:', response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load services');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to load services';
      console.error('Error fetching stages:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStageId) {
      toast.error('Please select a stage');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }
      
      if (editingService) {
        const response = await axios.put(
          `${API}/stages/${selectedStageId}/services/${editingService.service_id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          toast.success('Service updated successfully');
          console.log('Service updated:', response.data.data);
        } else {
          throw new Error(response.data.message || 'Update failed');
        }
      } else {
        const response = await axios.post(
          `${API}/stages/${selectedStageId}/services`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          toast.success('Service created successfully');
          console.log('Service created:', response.data.data);
        } else {
          throw new Error(response.data.message || 'Creation failed');
        }
      }
      
      setIsModalOpen(false);
      resetForm();
      await fetchStages();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Operation failed';
      console.error('Service operation error:', error);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (stageId, serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }
      
      const response = await axios.delete(`${API}/stages/${stageId}/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Service deleted successfully');
        await fetchStages();
      } else {
        throw new Error(response.data.message || 'Failed to delete service');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to delete service';
      console.error('Error deleting service:', error);
      toast.error(errorMessage);
    }
  };

  const openEditModal = (service, stageId) => {
    setEditingService(service);
    setSelectedStageId(stageId);
    setFormData({
      service_id: service.service_id,
      name: service.name,
      description: service.description,
      icon: service.icon,
      relevant_for: service.relevant_for || [],
      details: service.details
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingService(null);
    setSelectedStageId(null);
    setFormData({
      service_id: '',
      name: '',
      description: '',
      icon: 'Briefcase',
      relevant_for: ['startup', 'msme'],
      details: ''
    });
  };

  const iconOptions = [
    'Briefcase', 'Building2', 'Shield', 'Palette', 'Globe',
    'Users', 'FileText', 'CheckCircle', 'PenTool', 'Calculator',
    'TrendingUp', 'Truck', 'Award', 'Gavel', 'BarChart',
    'Search', 'DollarSign', 'Target', 'LineChart'
  ];

  const allServices = stages.flatMap(stage => 
    stage.services.map(service => ({ ...service, stageId: stage.id, stageName: stage.title }))
  );

  const filteredServices = allServices.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services Management</h1>
          <p className="text-gray-600 mt-1">Manage your business services</p>
        </div>
        <Button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Services Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Relevant For</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icon</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredServices.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{service.name}</div>
                      <div className="text-sm text-gray-500">{service.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline">{service.stageName}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {service.relevant_for?.map(type => (
                        <Badge key={type} className="bg-blue-100 text-blue-800">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{service.icon}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(service, service.stageId)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(service.stageId, service.service_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Stage</label>
              <select
                value={selectedStageId || ''}
                onChange={(e) => setSelectedStageId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                required
              >
                <option value="">Select Stage</option>
                {stages.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Service ID (URL-friendly)</label>
              <input
                type="text"
                value={formData.service_id}
                onChange={(e) => setFormData({...formData, service_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="e.g., company-formation"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Service Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Short Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                rows="2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Full Details</label>
              <ReactQuill
                theme="snow"
                value={formData.details}
                onChange={(value) => setFormData({...formData, details: value})}
                modules={{
                  toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['link'],
                  ['clean']
                  ]
                  }}
                />
              </div>

            <div>
              <label className="block text-sm font-medium mb-2">Icon</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              >
                {iconOptions.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Relevant For</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.relevant_for.includes('startup')}
                    onChange={(e) => {
                      const relevant = e.target.checked
                        ? [...formData.relevant_for, 'startup']
                        : formData.relevant_for.filter(t => t !== 'startup');
                      setFormData({...formData, relevant_for: relevant});
                    }}
                    className="mr-2"
                  />
                  New Startups
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.relevant_for.includes('msme')}
                    onChange={(e) => {
                      const relevant = e.target.checked
                        ? [...formData.relevant_for, 'msme']
                        : formData.relevant_for.filter(t => t !== 'msme');
                      setFormData({...formData, relevant_for: relevant});
                    }}
                    className="mr-2"
                  />
                  Established MSME
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600">
                {editingService ? 'Update Service' : 'Create Service'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesManagement;
