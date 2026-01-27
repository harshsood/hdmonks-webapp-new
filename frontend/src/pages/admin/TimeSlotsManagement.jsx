import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/admin`;

const TimeSlotsManagement = () => {
  const [timeslots, setTimeslots] = useState([]);
  const [newSlot, setNewSlot] = useState({ date: '', time: '10:00', duration_minutes: 30 });

  useEffect(() => {
    fetchTimeslots();
  }, []);

  const fetchTimeslots = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/timeslots`);
      setTimeslots(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load timeslots');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(`${API}/timeslots`, newSlot, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Time slot created');
      fetchTimeslots();
      setNewSlot({ date: '', time: '10:00', duration_minutes: 30 });
    } catch (error) {
      toast.error('Failed to create');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this timeslot?')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/timeslots/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deleted');
      fetchTimeslots();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const groupedByDate = timeslots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Time Slots Management</h1>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Time Slot</h2>
        <form onSubmit={handleCreate} className="flex gap-4">
          <input type="date" value={newSlot.date} onChange={e => setNewSlot({...newSlot, date: e.target.value})} className="px-3 py-2 border rounded-lg" required />
          <input type="time" value={newSlot.time} onChange={e => setNewSlot({...newSlot, time: e.target.value})} className="px-3 py-2 border rounded-lg" required />
          <input type="number" value={newSlot.duration_minutes} onChange={e => setNewSlot({...newSlot, duration_minutes: Number(e.target.value)})} className="px-3 py-2 border rounded-lg w-32" placeholder="Duration (min)" />
          <Button type="submit" className="bg-orange-500"><Plus className="h-5 w-5 mr-2" />Create Slot</Button>
        </form>
      </Card>

      <div className="space-y-4">
        {Object.entries(groupedByDate).sort().map(([date, slots]) => (
          <Card key={date} className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
              <span className="text-sm text-gray-600">({slots.length} slots)</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {slots.sort((a, b) => a.time.localeCompare(b.time)).map(slot => (
                <div key={slot.id} className={`p-3 rounded-lg border ${slot.is_available ? 'bg-green-50 border-green-200' : 'bg-gray-100 border-gray-300'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{slot.time}</span>
                    <button onClick={() => handleDelete(slot.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-600">{slot.duration_minutes}min</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TimeSlotsManagement;
