import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/admin`;

const TestimonialsManagement = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', company: '', designation: '', text: '', rating: 5, published: true
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/testimonials`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTestimonials(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load testimonials');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(`${API}/testimonials`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Testimonial added');
      setIsModalOpen(false);
      fetchTestimonials();
      setFormData({ name: '', company: '', designation: '', text: '', rating: 5, published: true });
    } catch (error) {
      toast.error('Failed to add');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this testimonial?')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/testimonials/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deleted');
      fetchTestimonials();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Testimonials</h1>
        <Button onClick={() => setIsModalOpen(true)} className="bg-orange-500">
          <Plus className="h-5 w-5 mr-2" />Add Testimonial
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map(testimonial => (
          <Card key={testimonial.id} className="p-6">
            <div className="flex justify-between mb-3">
              <div className="flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(testimonial.id)}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
            <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
            <div>
              <p className="font-semibold">{testimonial.name}</p>
              <p className="text-sm text-gray-600">{testimonial.designation}</p>
              <p className="text-sm text-gray-500">{testimonial.company}</p>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Testimonial</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
            <input type="text" placeholder="Company" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
            <input type="text" placeholder="Designation" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            <textarea placeholder="Testimonial Text" value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows="4" required />
            <select value={formData.rating} onChange={e => setFormData({...formData, rating: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg">
              {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
            </select>
            <Button type="submit" className="w-full bg-orange-500">Add Testimonial</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestimonialsManagement;
