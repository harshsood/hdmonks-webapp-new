import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { usePartnerAuth } from '../../contexts/PartnerAuthContext';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const ClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { token } = usePartnerAuth();
  const [client, setClient] = useState(null);
  const [serviceForm, setServiceForm] = useState({ service_id: '', service_name: '', price: '' });

  const fetch = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/partner/clients/${clientId}`, { headers: { Authorization: `Bearer ${token}` } });
      setClient(res.data.data);
    } catch (e) { console.error(e); }
  }, [clientId, token]);

  useEffect(() => { if (token) fetch(); }, [token, clientId, fetch]);

  const addService = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND}/api/partner/clients/${clientId}/services`, serviceForm, { headers: { Authorization: `Bearer ${token}` } });
      setServiceForm({ service_id: '', service_name: '', price: '' });
      fetch();
    } catch (e) { console.error(e); }
  };

  const removeService = async (serviceId) => {
    try {
      await axios.delete(`${BACKEND}/api/partner/clients/${clientId}/services/${serviceId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetch();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-4">
      <button onClick={()=>navigate('/partner/clients')} className="text-blue-600">← Back to clients</button>
      <h2 className="text-2xl font-semibold">Client Detail</h2>
      <div className="p-4 bg-white rounded shadow">
        <div className="font-medium">{client?.full_name}</div>
        <div className="text-sm text-gray-500">{client?.email} • {client?.phone}</div>
      </div>

      <div className="p-4 bg-white rounded shadow">
        <h3 className="font-semibold mb-2">Services</h3>
        <ul className="space-y-2">
          {client?.services?.map(s => (
            <li key={s.id} className="flex justify-between items-center p-2 border rounded">
              <div>
                <div className="font-medium">{s.service_name || s.service_id}</div>
                <div className="text-sm text-gray-500">Price: ₹{s.price}</div>
              </div>
              <div>
                <button onClick={()=>removeService(s.id)} className="text-red-600">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 bg-white rounded shadow">
        <h3 className="font-semibold mb-2">Add Service</h3>
        <form onSubmit={addService} className="space-y-2">
          <input value={serviceForm.service_id} onChange={e=>setServiceForm({...serviceForm, service_id: e.target.value})} placeholder="Service ID" className="w-full p-2 border rounded" />
          <input value={serviceForm.service_name} onChange={e=>setServiceForm({...serviceForm, service_name: e.target.value})} placeholder="Service Name" className="w-full p-2 border rounded" />
          <input value={serviceForm.price} onChange={e=>setServiceForm({...serviceForm, price: parseFloat(e.target.value || 0)})} placeholder="Price" className="w-full p-2 border rounded" />
          <button className="w-full bg-orange-500 text-white py-2 rounded">Add</button>
        </form>
      </div>
    </div>
  );
};

export default ClientDetail;
