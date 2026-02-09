import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const PartnerRegister = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', name: '', phone: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BACKEND}/api/partner/register`, form);
      if (res.data.success) navigate('/partner/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Partner Register</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <input value={form.username} onChange={e=>setForm({...form, username: e.target.value})} placeholder="Username" className="w-full p-2 border rounded" />
          <input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="Email" className="w-full p-2 border rounded" />
          <input value={form.password} onChange={e=>setForm({...form, password: e.target.value})} type="password" placeholder="Password" className="w-full p-2 border rounded" />
          <input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="Name" className="w-full p-2 border rounded" />
          <input value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} placeholder="Phone" className="w-full p-2 border rounded" />
          <button className="w-full bg-orange-500 text-white py-2 rounded">Register</button>
        </form>
      </div>
    </div>
  );
};

export default PartnerRegister;
