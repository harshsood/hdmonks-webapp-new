import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { usePartnerAuth } from '../../contexts/PartnerAuthContext';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const { token } = usePartnerAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!token) return;
    const fetch = async () => {
      try {
        const res = await axios.get(`${BACKEND}/api/partner/revenue`, { headers: { Authorization: `Bearer ${token}` } });
        setSummary(res.data.data);
      } catch (e) { console.error(e); }
    };
    fetch();
  }, [token]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Revenue</div>
          <div className="text-2xl font-bold">₹{summary?.total_revenue ?? 0}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Clients</div>
          <div className="text-2xl font-bold">{summary?.by_client?.length ?? 0}</div>
        </div>
      </div>

      <div className="p-4 bg-white rounded shadow">
        <h3 className="font-semibold mb-2">Revenue by Client</h3>
        <ul className="space-y-2">
          {summary?.by_client?.map(c => (
            <li key={c.client_id} className="flex justify-between">
              <div>{c.client_name}</div>
              <div className="font-medium">₹{c.amount}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
