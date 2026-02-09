import React, { useState } from 'react';
import { usePartnerAuth } from '../../contexts/PartnerAuthContext';
import { useNavigate } from 'react-router-dom';

const PartnerLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = usePartnerAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(username, password);
    if (res.success) navigate('/partner/dashboard');
    else setError(res.error || 'Login failed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Partner Login</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Username" className="w-full p-2 border rounded" />
          <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" placeholder="Password" className="w-full p-2 border rounded" />
          <button className="w-full bg-orange-500 text-white py-2 rounded">Login</button>
        </form>
      </div>
    </div>
  );
};

export default PartnerLogin;
