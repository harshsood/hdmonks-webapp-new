import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/admin`;

const FAQManagement = () => {
  const [faqs, setFaqs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [formData, setFormData] = useState({
    question: '', answer: '', category: 'General', order: 0, published: true
  });

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/faqs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFaqs(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load FAQs');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      if (editingFAQ) {
        await axios.put(`${API}/faqs/${editingFAQ.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('FAQ updated');
      } else {
        await axios.post(`${API}/faqs`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('FAQ added');
      }
      setIsModalOpen(false);
      fetchFAQs();
      resetForm();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/faqs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('FAQ deleted');
      fetchFAQs();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const resetForm = () => {
    setEditingFAQ(null);
    setFormData({ question: '', answer: '', category: 'General', order: 0, published: true });
  };

  const openEditModal = (faq) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
      published: faq.published
    });
    setIsModalOpen(true);
  };

  const categories = [...new Set(faqs.map(f => f.category))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">FAQ Management</h1>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-orange-500">
          <Plus className="h-5 w-5 mr-2" />Add FAQ
        </Button>
      </div>

      {categories.map(category => (
        <div key={category} className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-800">{category}</h2>
          {faqs.filter(f => f.category === category).map(faq => (
            <Card key={faq.id} className="p-6">
              <div className="flex justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditModal(faq)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(faq.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ))}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingFAQ ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Question" value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
            <textarea placeholder="Answer" value={formData.answer} onChange={e => setFormData({...formData, answer: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows="4" required />
            <input type="text" placeholder="Category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
            <input type="number" placeholder="Order" value={formData.order} onChange={e => setFormData({...formData, order: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.published} onChange={e => setFormData({...formData, published: e.target.checked})} />
              <span>Published</span>
            </label>
            <Button type="submit" className="w-full bg-orange-500">{editingFAQ ? 'Update' : 'Add'} FAQ</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FAQManagement;
