import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

const UserServicePage = () => {
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/stages`)
      .then((response) => {
        const stages = response.data.data || [];
        const match = stages.flatMap((stage) => stage.services || []).find((item) => item.service_id === serviceId);
        setService(match || null);
      })
      .finally(() => setLoading(false));
  }, [serviceId]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading service...</div>;
  if (!service) return <div className="min-h-screen p-8 text-center"><h1 className="text-2xl font-bold">Service not found</h1><Link to="/dashboard" className="mt-4 inline-block text-orange-600">Back to dashboard</Link></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="text-sm font-medium text-orange-600 hover:text-orange-700">&larr; Back to dashboard</Link>
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">Service workspace</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{service.name}</h1>
          <p className="mt-5 text-lg leading-8 text-gray-600">{service.description}</p>
          {service.details && <div className="mt-8 border-t border-gray-100 pt-6 text-gray-700">{service.details}</div>}
          {service.features?.length > 0 && <ul className="mt-8 grid gap-3 sm:grid-cols-2">{service.features.map((feature) => <li key={feature} className="rounded-lg bg-orange-50 px-4 py-3 text-sm text-gray-700">{feature}</li>)}</ul>}
        </div>
      </main>
    </div>
  );
};

export default UserServicePage;
