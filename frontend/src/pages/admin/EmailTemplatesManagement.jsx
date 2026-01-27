import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/admin`;

const EmailTemplatesManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '', subject: '', html_content: '', template_type: 'contact', variables: []
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load templates');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      if (editingTemplate) {
        await axios.put(`${API}/templates/${editingTemplate.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Template updated');
      } else {
        await axios.post(`${API}/templates`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Template created');
      }
      setIsModalOpen(false);
      fetchTemplates();
      resetForm();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({ name: '', subject: '', html_content: '', template_type: 'contact', variables: [] });
  };

  const openEditModal = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      html_content: template.html_content,
      template_type: template.template_type,
      variables: template.variables
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-orange-500">
          <Plus className="h-5 w-5 mr-2" />New Template
        </Button>
      </div>

      <div className="grid gap-4">
        {templates.map(template => (
          <Card key={template.id} className="p-6">
            <div className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">{template.name}</h3>
                <p className="text-sm text-gray-600 mt-1">Type: {template.template_type}</p>
                <p className="text-sm text-gray-600">Subject: {template.subject}</p>
                <p className="text-xs text-gray-500 mt-2">Variables: {template.variables?.join(', ')}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => openEditModal(template)}>
                <Edit className="h-4 w-4 mr-2" />Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingTemplate ? 'Edit Template' : 'New Template'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Template Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
            <input type="text" placeholder="Email Subject" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
            <select value={formData.template_type} onChange={e => setFormData({...formData, template_type: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
              <option value="contact">Contact Inquiry</option>
              <option value="booking">Booking Confirmation</option>
              <option value="newsletter">Newsletter</option>
            </select>
            <div>
              <label className="block text-sm font-medium mb-2">HTML Content</label>
              <textarea value={formData.html_content} onChange={e => setFormData({...formData, html_content: e.target.value})} className="w-full px-3 py-2 border rounded-lg font-mono text-sm" rows="15" required placeholder="<html>...</html>" />
            </div>
            <Button type="submit" className="w-full bg-orange-500">{editingTemplate ? 'Update' : 'Create'} Template</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplatesManagement;
