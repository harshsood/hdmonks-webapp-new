import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Save, X } from 'lucide-react';
import axios from 'axios';
import { useHRMSAuth } from '../../contexts/HRMSAuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/hrms/organization`;
const RESOURCES = [
  ['companies', 'Companies'], ['branches', 'Branches'], ['departments', 'Departments'], ['teams', 'Teams'],
  ['designations', 'Designations'], ['job_grades', 'Job grades'], ['locations', 'Locations'], ['employment_types', 'Employment types'],
];
const emptyForm = { name: '', code: '', description: '', company_id: '', branch_id: '', department_id: '', manager_employee_id: '' };

const OrganizationManagement = () => {
  const { token, hasPermission, refreshKey } = useHRMSAuth();
  const [activeResource, setActiveResource] = useState('companies');
  const [data, setData] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API, { headers: { Authorization: `Bearer ${token}` } });
      setData(response.data.data || {});
    } catch (loadError) {
      setError(loadError.response?.data?.detail || 'Unable to load organization hierarchy.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const save = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (editing) await axios.put(`${API}/${activeResource}/${editing.id}`, form, { headers });
      else await axios.post(`${API}/${activeResource}`, form, { headers });
      setMessage(`${RESOURCES.find(([key]) => key === activeResource)?.[1] || 'Record'} saved.`);
      setForm(emptyForm);
      setEditing(null);
      await load();
    } catch (saveError) {
      setError(saveError.response?.data?.detail || 'Unable to save record.');
    }
  };

  const deactivate = async (item) => {
    try {
      await axios.delete(`${API}/${activeResource}/${item.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Record deactivated.');
      await load();
    } catch (deleteError) {
      setError(deleteError.response?.data?.detail || 'Unable to deactivate record.');
    }
  };

  const edit = (item) => {
    setEditing(item);
    setForm({ ...emptyForm, ...item });
  };

  const options = (resource) => data[resource] || [];
  const parentFields = {
    branches: ['company_id', 'companies'],
    departments: ['branch_id', 'branches'],
    teams: ['department_id', 'departments'],
  };

  if (loading) return <div className="p-8 text-gray-500">Loading organization hierarchy...</div>;

  return (
    <section className="space-y-6">
      <div><div className="flex items-center gap-3"><Building2 className="h-7 w-7 text-orange-500" /><h1 className="text-3xl font-bold text-gray-900">Organization management</h1></div><p className="mt-2 text-gray-600">Company, branch, department, team, manager, and employee hierarchy.</p></div>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-gray-900">Organization hierarchy</h2><div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-medium text-gray-700"><span className="rounded bg-orange-100 px-3 py-2">Company</span><span>↓</span><span className="rounded bg-orange-100 px-3 py-2">Branch</span><span>↓</span><span className="rounded bg-orange-100 px-3 py-2">Department</span><span>↓</span><span className="rounded bg-orange-100 px-3 py-2">Team</span><span>↓</span><span className="rounded bg-orange-100 px-3 py-2">Manager</span><span>↓</span><span className="rounded bg-orange-100 px-3 py-2">Employees</span></div></div>

      <div className="flex gap-2 overflow-x-auto border-b border-gray-200">{RESOURCES.map(([key, label]) => <button key={key} type="button" onClick={() => { setActiveResource(key); setEditing(null); setForm(emptyForm); }} className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${activeResource === key ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'}`}>{label}</button>)}</div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {hasPermission('organization.manage') && <form onSubmit={save} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold text-gray-900">{editing ? 'Edit' : 'Add'} {RESOURCES.find(([key]) => key === activeResource)?.[1]}</h2>{editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} aria-label="Cancel edit"><X className="h-4 w-4 text-gray-500" /></button>}</div><div className="mt-4 space-y-3"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" /><input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="Code" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" /><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" rows="3" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />{parentFields[activeResource] && <select value={form[parentFields[activeResource][0]]} onChange={(event) => setForm({ ...form, [parentFields[activeResource][0]]: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"><option value="">Select parent</option>{options(parentFields[activeResource][1]).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}<button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"><Save className="h-4 w-4" />Save</button></div></form>}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold text-gray-900">{RESOURCES.find(([key]) => key === activeResource)?.[1]}</h2>{hasPermission('organization.manage') && <span className="text-xs text-gray-500">Soft deactivation only</span>}</div><div className="mt-4 space-y-2">{options(activeResource).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3"><div><p className="font-medium text-gray-900">{item.name}</p><p className="text-xs text-gray-500">{item.code || item.description || 'No description'}{item.is_active === false ? ' · inactive' : ''}</p></div>{hasPermission('organization.manage') && <div className="flex gap-2"><button type="button" onClick={() => edit(item)} className="text-sm font-medium text-orange-600">Edit</button>{item.is_active !== false && <button type="button" onClick={() => deactivate(item)} className="text-sm font-medium text-red-600">Deactivate</button>}</div>}</div>)}{!options(activeResource).length && <p className="py-8 text-center text-sm text-gray-500">No records yet.</p>}</div></div>
      </div>
    </section>
  );
};

export default OrganizationManagement;
