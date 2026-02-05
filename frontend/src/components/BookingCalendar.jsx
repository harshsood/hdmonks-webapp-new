import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, CheckCircle2, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookingCalendar = ({ isOpen, onClose }) => {
  const [timeslots, setTimeslots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    business_type: 'New Startup',
    service_interest: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchTimeslots();
    }
  }, [isOpen]);

  const fetchTimeslots = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/timeslots?t=${Date.now()}`);
      if (response.data.success) {
        setTimeslots(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching timeslots:', error);
      toast.error('Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  const groupSlotsByDate = () => {
    const grouped = {};
    timeslots.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });
    return grouped;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    if (!formData.full_name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingData = {
        ...formData,
        timeslot_id: selectedSlot.id
      };

      console.log("[v0] Submitting booking:", bookingData);
      const response = await axios.post(`${API}/booking`, bookingData);
      
      console.log("[v0] Booking response:", response.data);
      if (response.data.success) {
        toast.success('Consultation booked successfully! Check your email for confirmation.');
        // Reset form
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          business_type: 'New Startup',
          service_interest: '',
          message: ''
        });
        setSelectedSlot(null);
        // Close dialog after brief delay
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        toast.error(response.data.detail || 'Failed to book consultation');
      }
    } catch (error) {
      console.error("[v0] Booking error:", error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to book consultation';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedSlots = groupSlotsByDate();
  const dates = Object.keys(groupedSlots).sort();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-orange-500" />
            <span>Book Free Consultation</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Time Slot Selection */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Select Date & Time</h3>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading available slots...</div>
            ) : dates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No available slots at the moment</div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {dates.map(date => (
                  <div key={date} className="space-y-2">
                    <h4 className="font-medium text-gray-700 sticky top-0 bg-white py-2">
                      {formatDate(date)}
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {groupedSlots[date].map(slot => (
                        <button
                          key={slot.id}
                          onClick={() => handleSlotSelect(slot)}
                          className={`p-2 text-sm rounded-lg border transition-all duration-200 ${
                            selectedSlot?.id === slot.id
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-white hover:border-orange-300 hover:bg-orange-50 border-gray-300'
                          }`}
                        >
                          <Clock className="h-4 w-4 mx-auto mb-1" />
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedSlot && (
              <Card className="mt-4 p-4 bg-orange-50 border-orange-200">
                <p className="text-sm font-medium text-gray-700">Selected Time:</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatDate(selectedSlot.date)} at {selectedSlot.time}
                </p>
              </Card>
            )}
          </div>

          {/* Booking Form */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Your Information</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  placeholder="+91 XXXXX XXXXX"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Business Type *</label>
                <select
                  name="business_type"
                  value={formData.business_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                >
                  <option>New Startup</option>
                  <option>Established MSME</option>
                  <option>Growing Business</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Service Interest (Optional)</label>
                <input
                  type="text"
                  name="service_interest"
                  value={formData.service_interest}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  placeholder="e.g., Company Formation, Taxation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Message (Optional)</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
                  placeholder="Any specific requirements or questions..."
                ></textarea>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isSubmitting || !selectedSlot}
              >
                {isSubmitting ? (
                  'Booking...'
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Confirm Booking
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingCalendar;
