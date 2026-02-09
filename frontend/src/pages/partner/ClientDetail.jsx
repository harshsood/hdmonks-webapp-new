import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { usePartnerAuth } from '../../contexts/PartnerAuthContext';
import { Card } from '../../components/ui/card';
import { ArrowLeft, Plus, Trash2, FileText, Download, Mail, Phone, MapPin } from 'lucide-react';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const ClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { token } = usePartnerAuth();
  const [client, setClient] = useState(null);
  const [serviceForm, setServiceForm] = useState({ service_id: '', service_name: '', price: '' });
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedServiceForReceipt, setSelectedServiceForReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND}/api/partner/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClient(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [clientId, token]);

  useEffect(() => {
    if (token) fetch();
  }, [token, clientId, fetch]);

  const addService = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND}/api/partner/clients/${clientId}/services`, serviceForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServiceForm({ service_id: '', service_name: '', price: '' });
      fetch();
    } catch (e) {
      console.error(e);
    }
  };

  const removeService = async (serviceId) => {
    try {
      await axios.delete(`${BACKEND}/api/partner/clients/${clientId}/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetch();
    } catch (e) {
      console.error(e);
    }
  };

  const generateReceipt = (service) => {
    setSelectedServiceForReceipt(service);
    setShowReceiptModal(true);
  };

  const downloadReceipt = () => {
    const receiptContent = generateReceiptHTML();
    const blob = new Blob([receiptContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${selectedServiceForReceipt?.id || 'unknown'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setShowReceiptModal(false);
  };

  const generateReceiptHTML = () => {
    return `
      <html>
        <head>
          <title>Receipt - ${client?.full_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background-color: #f9fafb; }
            .container { max-width: 700px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f97316; padding-bottom: 20px; }
            .company { font-size: 24px; font-weight: bold; color: #1f2937; }
            .receipt-title { font-size: 20px; font-weight: bold; color: #f97316; margin-top: 10px; }
            .receipt-id { color: #888; font-size: 12px; margin-top: 10px; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; color: #374151; font-size: 14px; text-transform: uppercase; margin-bottom: 10px; }
            .detail-row { margin: 8px 0; color: #6b7280; }
            .detail-label { font-weight: 600; color: #1f2937; }
            .amount { font-size: 28px; font-weight: bold; color: #f97316; margin: 20px 0; }
            .footer { margin-top: 30px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="company">HD Monks</div>
              <div class="receipt-title">Service Receipt</div>
              <p class="receipt-id">Receipt #${Math.floor(Math.random() * 1000000)}</p>
              <p class="receipt-id">Date: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="section">
              <div class="section-title">Service Details</div>
              <div class="detail-row"><span class="detail-label">Service:</span> ${selectedServiceForReceipt?.service_name}</div>
              <div class="detail-row"><span class="detail-label">Service ID:</span> ${selectedServiceForReceipt?.service_id}</div>
              ${selectedServiceForReceipt?.purchase_date ? `<div class="detail-row"><span class="detail-label">Purchased:</span> ${new Date(selectedServiceForReceipt.purchase_date).toLocaleDateString()}</div>` : ''}
            </div>
            
            <div class="section">
              <div class="section-title">Client Information</div>
              <div class="detail-row"><span class="detail-label">Name:</span> ${client?.full_name}</div>
              <div class="detail-row"><span class="detail-label">Email:</span> ${client?.email}</div>
              <div class="detail-row"><span class="detail-label">Phone:</span> ${client?.phone}</div>
              ${client?.company ? `<div class="detail-row"><span class="detail-label">Company:</span> ${client?.company}</div>` : ''}
            </div>
            
            <div class="section" style="text-align: center;">
              <div class="section-title">Amount Due</div>
              <div class="amount">₹${selectedServiceForReceipt?.price}</div>
            </div>
            
            <div class="footer">
              <p>Thank you for using HD Monks services!</p>
              <p>For support, contact us at support@hdmonks.com</p>
              <p style="margin-top: 20px; font-size: 10px; color: #ccc;">Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/partner/clients')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Clients</span>
        </button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">{client?.full_name}</h1>
        <p className="text-gray-600 mt-1">Manage client details and services</p>
      </div>

      {/* Client Information Card */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Client Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-gray-900 font-medium">{client?.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="text-gray-900 font-medium">{client?.phone}</p>
            </div>
          </div>
          {client?.company && (
            <div className="flex items-center space-x-3 md:col-span-2">
              <MapPin className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Company</p>
                <p className="text-gray-900 font-medium">{client?.company}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Services Section */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Services Availed</h2>
        {client?.services && client.services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {client?.services?.map(s => (
              <Card key={s.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{s.service_name || s.service_id}</h3>
                    {s.purchase_date && (
                      <p className="text-sm text-gray-600 mt-1">
                        Purchased: {new Date(s.purchase_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">₹{s.price}</p>
                  </div>
                </div>
                {s.metadata && (
                  <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
                    <p><strong>Additional Info:</strong> {typeof s.metadata === 'object' ? JSON.stringify(s.metadata) : s.metadata}</p>
                  </div>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={() => generateReceipt(s)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Receipt</span>
                  </button>
                  <button
                    onClick={() => removeService(s.id)}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-gray-600">No services added yet. Add one below!</p>
          </Card>
        )}
      </div>

      {/* Add Service Form */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Add New Service</span>
        </h2>
        <form onSubmit={addService} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service ID</label>
              <input
                value={serviceForm.service_id}
                onChange={e => setServiceForm({ ...serviceForm, service_id: e.target.value })}
                placeholder="e.g., SRV001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
              <input
                value={serviceForm.service_name}
                onChange={e => setServiceForm({ ...serviceForm, service_name: e.target.value })}
                placeholder="e.g., Web Design"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="number"
                value={serviceForm.price}
                onChange={e => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value || 0) })}
                placeholder="e.g., 5000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors"
          >
            Add Service
          </button>
        </form>
      </Card>

      {/* Receipt Modal */}
      {showReceiptModal && selectedServiceForReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Service Receipt</h2>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6 mb-6 p-6 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Receipt #</p>
                  <p className="text-lg font-bold text-gray-900">{Math.floor(Math.random() * 1000000)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium text-gray-900">{new Date().toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-bold text-orange-600 text-lg">₹{selectedServiceForReceipt?.price}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Service Details</p>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="font-medium text-gray-900">{selectedServiceForReceipt?.service_name}</p>
                    <p className="text-sm text-gray-600">ID: {selectedServiceForReceipt?.service_id}</p>
                    {selectedServiceForReceipt?.purchase_date && (
                      <p className="text-sm text-gray-600">
                        Purchased: {new Date(selectedServiceForReceipt.purchase_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Client Details</p>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="font-medium text-gray-900">{client?.full_name}</p>
                    <p className="text-sm text-gray-600">{client?.email}</p>
                    <p className="text-sm text-gray-600">{client?.phone}</p>
                    {client?.company && <p className="text-sm text-gray-600">{client?.company}</p>}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={downloadReceipt}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Receipt</span>
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ClientDetail;
