import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Mail, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/admin`;

const InquiriesManagement = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/inquiries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInquiries(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(`${API}/inquiries/${id}/status?status=${status}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Status updated');
      fetchInquiries();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredInquiries = filter === 'all' 
    ? inquiries 
    : inquiries.filter(i => i.status === filter);

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contact Inquiries</h1>
        <p className="text-gray-600 mt-1">Manage customer inquiries</p>
      </div>

      <div className="flex gap-2">
        {['all', 'new', 'contacted', 'closed'].map(status => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            onClick={() => setFilter(status)}
            className={filter === status ? 'bg-orange-500' : ''}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredInquiries.map(inquiry => (
          <Card key={inquiry.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{inquiry.full_name}</h3>
                  <Badge className={
                    inquiry.status === 'new' ? 'bg-yellow-500' :
                    inquiry.status === 'contacted' ? 'bg-blue-500' : 'bg-green-500'
                  }>
                    {inquiry.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {inquiry.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {inquiry.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {new Date(inquiry.created_at).toLocaleString()}
                  </div>
                </div>
                <p className="mt-3 text-gray-700">{inquiry.message}</p>
              </div>
              <div className="flex gap-2">
                {inquiry.status !== 'contacted' && (
                  <Button size="sm" onClick={() => updateStatus(inquiry.id, 'contacted')}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Contacted
                  </Button>
                )}
                {inquiry.status !== 'closed' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(inquiry.id, 'closed')}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Close
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InquiriesManagement;
