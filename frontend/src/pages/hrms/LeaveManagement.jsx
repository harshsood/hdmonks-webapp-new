import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Plus, X } from 'lucide-react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { useHRMSAuth } from '../../contexts/HRMSAuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/hrms/leave`;
const types = ['CASUAL', 'SICK', 'EARNED', 'PRIVILEGE', 'MATERNITY', 'PATERNITY', 'COMP_OFF', 'UNPAID', 'WFH'];
const blankApplication = { leave_type: 'CASUAL', start_date: '', end_date: '', duration: 'full_day', hours: '', reason: '' };

const LeaveManagement = () => {
  const { token, hasPermission } = useHRMSAuth();
  const location = useLocation();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const page = location.pathname.split('/').pop();
  const [applications, setApplications] = useState([]);
  const [balances, setBalances] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState(blankApplication);
  const [policyForm, setPolicyForm] = useState({ code: 'CASUAL', name: 'Casual Leave', annual_entitlement: 12, accrual_frequency: 'monthly', carry_forward_allowed: false, carry_forward_limit: 0, encashment_allowed: false, encashment_limit: 0, allow_half_day: true, allow_hourly: false, requires_hr_approval: false, is_active: true });
  const [holidayForm, setHolidayForm] = useState({ name: '', holiday_date: '', is_optional: false, is_active: true });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [applicationResponse, balanceResponse, typesResponse, calendarResponse] = await Promise.all([
        axios.get(API, { headers }), axios.get(`${API}/balance`, { headers }), axios.get(`${API}/types`, { headers }), axios.get(`${API}/calendar`, { headers }),
      ]);
      setApplications(applicationResponse.data.data || []);
      setBalances(balanceResponse.data.data || []);
      setLeaveTypes(typesResponse.data.data || []);
      setHolidays(calendarResponse.data.data?.holidays || []);
    } catch (loadError) { setError(loadError.response?.data?.detail || 'Unable to load leave data.'); } finally { setLoading(false); }
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const apply = async (event) => {
    event.preventDefault();
    try { await axios.post(`${API}/apply`, { ...form, hours: form.hours ? Number(form.hours) : undefined }, { headers }); setMessage('Leave application submitted.'); setForm(blankApplication); await load(); } catch (applyError) { setError(applyError.response?.data?.detail || 'Unable to apply for leave.'); }
  };

  const decide = async (id, decision) => {
    try { await axios.post(`${API}/${id}/decision`, { decision }, { headers }); setMessage(`Leave ${decision}.`); await load(); } catch (decisionError) { setError(decisionError.response?.data?.detail || 'Unable to update leave.'); }
  };

  const cancel = async (id) => {
    try { await axios.post(`${API}/${id}/cancel`, null, { headers }); setMessage('Leave cancelled and balance restored.'); await load(); } catch (cancelError) { setError(cancelError.response?.data?.detail || 'Unable to cancel leave.'); }
  };

  const saveType = async (event) => {
    event.preventDefault();
    try { await axios.post(`${API}/types`, { ...policyForm, annual_entitlement: Number(policyForm.annual_entitlement), carry_forward_limit: Number(policyForm.carry_forward_limit), encashment_limit: Number(policyForm.encashment_limit) }, { headers }); setMessage('Leave policy saved.'); await load(); } catch (policyError) { setError(policyError.response?.data?.detail || 'Unable to save leave policy.'); }
  };

  const saveHoliday = async (event) => {
    event.preventDefault();
    try { await axios.post(`${API}/holidays`, holidayForm, { headers }); setMessage('Holiday added.'); setHolidayForm({ name: '', holiday_date: '', is_optional: false, is_active: true }); await load(); } catch (holidayError) { setError(holidayError.response?.data?.detail || 'Unable to save holiday.'); }
  };

  const isApply = page === 'apply';
  const isBalance = page === 'balance';
  const isCalendar = page === 'calendar';

  return (
    <section className="space-y-6">
      <div><p className="text-sm font-semibold uppercase tracking-wider text-orange-600">HRMS</p><h1 className="mt-1 text-3xl font-bold text-gray-900">Leave management</h1><p className="mt-2 text-gray-600">Apply, review, and administer leave within your authorized scope.</p></div>
      <nav className="flex gap-2 overflow-x-auto border-b border-gray-200">{[['leave', 'Requests'], ['apply', 'Apply leave'], ['balance', 'Balance'], ['calendar', 'Calendar']].map(([path, label]) => <Link key={path} to={`/hrms/leave${path === 'leave' ? '' : `/${path}`}`} className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${((isApply && path === 'apply') || (isBalance && path === 'balance') || (isCalendar && path === 'calendar') || (!isApply && !isBalance && !isCalendar && path === 'leave')) ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'}`}>{label}</Link>)}</nav>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}{message && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}

      {isApply && <form onSubmit={apply} className="max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold text-gray-900">Apply for leave</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="block text-sm"><span className="mb-1 block font-medium">Leave type</span><select value={form.leave_type} onChange={(event) => setForm({ ...form, leave_type: event.target.value })} className="w-full rounded-lg border px-3 py-2.5">{(leaveTypes.length ? leaveTypes.map((item) => item.code) : types).map((item) => <option key={item}>{item}</option>)}</select></label><label className="block text-sm"><span className="mb-1 block font-medium">Duration</span><select value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} className="w-full rounded-lg border px-3 py-2.5"><option value="full_day">Full day</option><option value="half_day">Half day</option><option value="hours">Hours</option></select></label><label className="block text-sm"><span className="mb-1 block font-medium">Start date</span><input required type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} className="w-full rounded-lg border px-3 py-2.5" /></label><label className="block text-sm"><span className="mb-1 block font-medium">End date</span><input required type="date" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} className="w-full rounded-lg border px-3 py-2.5" /></label>{form.duration === 'hours' && <label className="block text-sm"><span className="mb-1 block font-medium">Hours</span><input required type="number" min="0.5" max="24" step="0.5" value={form.hours} onChange={(event) => setForm({ ...form, hours: event.target.value })} className="w-full rounded-lg border px-3 py-2.5" /></label>}</div><textarea required minLength="3" placeholder="Reason" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} className="mt-4 w-full rounded-lg border px-3 py-2.5" rows="3" /><button type="submit" className="mt-4 rounded-lg bg-orange-500 px-4 py-2.5 font-semibold text-white">Submit application</button></form>}

      {isBalance && <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{balances.map((balance) => <div key={balance.leave_type} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><p className="font-semibold text-gray-900">{balance.leave_type}</p><p className="mt-3 text-3xl font-bold text-orange-600">{balance.available ?? 0}</p><p className="text-sm text-gray-500">Available of {balance.entitled ?? 0}</p><div className="mt-3 text-xs text-gray-500">Used: {balance.used || 0} · Reserved: {balance.reserved || 0} · Carried: {balance.carried_forward || 0}</div></div>)}{!balances.length && <p className="text-sm text-gray-500">No leave balances have been configured.</p>}</div>}

      {isCalendar && <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-xl font-semibold"><CalendarDays className="h-5 w-5 text-orange-500" />Team and organisation calendar</h2><div className="mt-5 space-y-3">{holidays.map((holiday) => <div key={holiday.id} className="rounded-lg border px-4 py-3"><span className="font-medium">{holiday.holiday_date}</span> · {holiday.name}{holiday.is_optional ? ' · Optional' : ''}</div>)}{applications.map((item) => <div key={item.id} className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3"><span className="font-medium">{item.start_date} to {item.end_date}</span> · {item.leave_type} · {item.status}</div>)}{!holidays.length && !applications.length && <p className="text-sm text-gray-500">No calendar events found.</p>}</div></div>}

      {!isApply && !isBalance && !isCalendar && <><div className="rounded-xl border border-gray-200 bg-white shadow-sm"><div className="border-b px-5 py-4"><h2 className="font-semibold text-gray-900">Leave applications</h2></div><div className="divide-y">{loading ? <p className="p-5 text-sm text-gray-500">Loading leave...</p> : applications.map((item) => <div key={item.id} className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"><div><p className="font-semibold text-gray-900">{item.leave_type} · {item.start_date} to {item.end_date}</p><p className="mt-1 text-sm text-gray-500">{item.reason} · {item.days} day(s) · {item.status}</p></div><div className="flex gap-2">{hasPermission('leave.approve') && ['pending_manager', 'pending_hr'].includes(item.status) && <><button type="button" onClick={() => decide(item.id, 'approved')} className="flex items-center gap-1 rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white"><Check className="h-4 w-4" />Approve</button><button type="button" onClick={() => decide(item.id, 'rejected')} className="flex items-center gap-1 rounded border border-red-300 px-3 py-2 text-sm font-semibold text-red-700"><X className="h-4 w-4" />Reject</button></>}{hasPermission('leave.cancel') && ['pending_manager', 'pending_hr', 'approved'].includes(item.status) && <button type="button" onClick={() => cancel(item.id)} className="text-sm font-medium text-gray-600">Cancel</button>}</div></div>)}{!loading && !applications.length && <p className="p-5 text-sm text-gray-500">No leave applications found.</p>}</div></div>{hasPermission('leave.manage') && <div className="grid gap-6 lg:grid-cols-2"><form onSubmit={saveType} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Configure leave type and policy</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><select value={policyForm.code} onChange={(event) => setPolicyForm({ ...policyForm, code: event.target.value })} className="rounded border px-3 py-2">{types.map((type) => <option key={type}>{type}</option>)}</select><input value={policyForm.name} onChange={(event) => setPolicyForm({ ...policyForm, name: event.target.value })} placeholder="Name" className="rounded border px-3 py-2" /><input type="number" value={policyForm.annual_entitlement} onChange={(event) => setPolicyForm({ ...policyForm, annual_entitlement: event.target.value })} placeholder="Annual entitlement" className="rounded border px-3 py-2" /><select value={policyForm.accrual_frequency} onChange={(event) => setPolicyForm({ ...policyForm, accrual_frequency: event.target.value })} className="rounded border px-3 py-2"><option>monthly</option><option>quarterly</option><option>yearly</option><option>none</option></select></div><div className="mt-4 flex flex-wrap gap-4 text-sm"><label><input type="checkbox" checked={policyForm.carry_forward_allowed} onChange={(event) => setPolicyForm({ ...policyForm, carry_forward_allowed: event.target.checked })} /> Carry forward</label><label><input type="checkbox" checked={policyForm.encashment_allowed} onChange={(event) => setPolicyForm({ ...policyForm, encashment_allowed: event.target.checked })} /> Encashment</label><label><input type="checkbox" checked={policyForm.allow_half_day} onChange={(event) => setPolicyForm({ ...policyForm, allow_half_day: event.target.checked })} /> Half day</label><label><input type="checkbox" checked={policyForm.allow_hourly} onChange={(event) => setPolicyForm({ ...policyForm, allow_hourly: event.target.checked })} /> Hourly</label></div><button type="submit" className="mt-4 rounded bg-orange-500 px-4 py-2 font-semibold text-white">Save leave policy</button></form><form onSubmit={saveHoliday} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Holiday calendar</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><input required placeholder="Holiday name" value={holidayForm.name} onChange={(event) => setHolidayForm({ ...holidayForm, name: event.target.value })} className="rounded border px-3 py-2" /><input required type="date" value={holidayForm.holiday_date} onChange={(event) => setHolidayForm({ ...holidayForm, holiday_date: event.target.value })} className="rounded border px-3 py-2" /></div><label className="mt-4 block text-sm"><input type="checkbox" checked={holidayForm.is_optional} onChange={(event) => setHolidayForm({ ...holidayForm, is_optional: event.target.checked })} /> Optional holiday</label><button type="submit" className="mt-4 rounded bg-orange-500 px-4 py-2 font-semibold text-white"><Plus className="mr-1 inline h-4 w-4" />Add holiday</button></form></div>}</>}
    </section>
  );
};

export default LeaveManagement;
