import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { usePartnerAuth } from '../../contexts/PartnerAuthContext';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const ClientsManagement = () => {
  const { token } = usePartnerAuth();
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', company: '' });

  const fetchClients = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/partner/clients`, { headers: { Authorization: `Bearer ${token}` } });
      setClients(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (token) fetchClients(); }, [token]);

  const createClient = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND}/api/partner/clients`, form, { headers: { Authorization: `Bearer ${token}` } });
      setForm({ full_name: '', email: '', phone: '', company: '' });
      fetchClients();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Clients</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1 p-4 bg-white rounded shadow">
          <h3 className="font-semibold mb-2">Add Client</h3>
          <form onSubmit={createClient} className="space-y-2">
            <input value={form.full_name} onChange={e=>setForm({...form, full_name: e.target.value})} placeholder="Full name" className="w-full p-2 border rounded" />
            <input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="Email" className="w-full p-2 border rounded" />
            <input value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} placeholder="Phone" className="w-full p-2 border rounded" />
            <input value={form.company} onChange={e=>setForm({...form, company: e.target.value})} placeholder="Company" className="w-full p-2 border rounded" />
            <button className="w-full bg-orange-500 text-white py-2 rounded">Create</button>
          </form>
        </div>

        <div className="md:col-span-2 p-4 bg-white rounded shadow">
          <h3 className="font-semibold mb-2">Client List</h3>
          <div className="space-y-2">
            {clients.map(c => (
              <div key={c.id} className="p-2 border rounded flex justify-between items-center">
                <div>
                  <div className="font-medium">{c.full_name}</div>
                  <div className="text-sm text-gray-500">{c.email} • {c.phone}</div>
                </div>
                <div>
                  <a href={`/partner/clients/${c.id}`} className="text-blue-600">Manage</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsManagement;
