import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Calendar as CalendarIcon, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/admin`;

const BookingsManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(`${API}/bookings/${id}/status?status=${status}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Status updated');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Consultation Bookings</h1>

      <div className="grid gap-4">
        {bookings.map(booking => (
          <Card key={booking.id} className="p-6">
            <div className="flex justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{booking.full_name}</h3>
                  <Badge className={
                    booking.status === 'confirmed' ? 'bg-blue-500' :
                    booking.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                  }>
                    {booking.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4" />{booking.email}</div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{booking.phone}</div>
                  <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" />{booking.date} at {booking.time}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateStatus(booking.id, 'completed')}>Complete</Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(booking.id, 'cancelled')}>Cancel</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BookingsManagement;
