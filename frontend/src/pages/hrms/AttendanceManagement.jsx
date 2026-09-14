import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, LogIn, LogOut, RefreshCw, XCircle } from 'lucide-react';
import axios from 'axios';
import { useHRMSAuth } from '../../contexts/HRMSAuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/hrms/attendance`;
const states = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'EARLY_EXIT', 'ON_LEAVE', 'WFH', 'HOLIDAY', 'WEEKLY_OFF', 'OVERTIME'];
const pad = (value) => String(value).padStart(2, '0');
const monthBounds = () => { const now = new Date(); return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}` }; };

const AttendanceManagement = () => {
  const { token, roles, hasPermission } = useHRMSAuth();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ counts: {}, total_hours: 0, days: 0 });
  const [corrections, setCorrections] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [policy, setPolicy] = useState({ name: 'Standard policy', workday_hours: 8, late_grace_minutes: 15, half_day_hours: 4, overtime_after_hours: 8, is_active: true });
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({ ...monthBounds(), employee_id: '', department: '' });
  const [month, setMonth] = useState(new Date());
  const [correction, setCorrection] = useState({ attendance_date: '', requested_check_in: '', requested_check_out: '', requested_status: 'PRESENT', reason: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const canManage = hasPermission('attendance.manage');
  const canSelfTrack = hasPermission('attendance.view');
  const canApprove = hasPermission('attendance.approve');
  const isEmployeeOnly = roles.includes('employee') && !roles.some((role) => ['super_admin', 'hr_admin', 'manager', 'hr_viewer', 'payroll_admin', 'finance'].includes(role));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
      const [attendanceResponse, summaryResponse, correctionsResponse] = await Promise.all([
        axios.get(`${API}?${params.toString()}`, { headers }),
        axios.get(`${API}/summary?date_from=${filters.date_from}&date_to=${filters.date_to}`, { headers }),
        axios.get(`${API}/corrections`, { headers }),
      ]);
      setRecords(attendanceResponse.data.data || []);
      setSummary(summaryResponse.data.data || { counts: {}, total_hours: 0, days: 0 });
      setCorrections(correctionsResponse.data.data || []);
      const policyResponse = await axios.get(`${API}/policies`, { headers });
      setPolicies(policyResponse.data.data || []);
    } catch (loadError) {
      setError(loadError.response?.data?.detail || 'Unable to load attendance.');
    } finally {
      setLoading(false);
    }
  }, [filters, headers]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/hrms/employees?page_size=100`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setEmployees(response.data.data || []))
      .catch(() => undefined);
  }, [token]);

  const check = async (path) => {
    try {
      await axios.post(`${API}/${path}`, { source: 'web' }, { headers });
      setMessage(path === 'check-in' ? 'Checked in successfully.' : 'Checked out successfully.');
      await load();
    } catch (checkError) { setError(checkError.response?.data?.detail || 'Unable to update attendance.'); }
  };

  const submitCorrection = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`${API}/corrections`, correction, { headers });
      setMessage('Attendance correction submitted for approval.');
      setCorrection({ attendance_date: '', requested_check_in: '', requested_check_out: '', requested_status: 'PRESENT', reason: '' });
      await load();
    } catch (correctionError) { setError(correctionError.response?.data?.detail || 'Unable to submit correction.'); }
  };

  const decide = async (id, decision) => {
    try {
      await axios.post(`${API}/corrections/${id}/decision`, { decision }, { headers });
      setMessage(`Correction ${decision}.`);
      await load();
    } catch (decisionError) { setError(decisionError.response?.data?.detail || 'Unable to decide correction.'); }
  };

  const savePolicy = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`${API}/policies`, {
        ...policy,
        workday_hours: Number(policy.workday_hours),
        late_grace_minutes: Number(policy.late_grace_minutes),
        half_day_hours: Number(policy.half_day_hours),
        overtime_after_hours: Number(policy.overtime_after_hours),
      }, { headers });
      setMessage('Attendance policy saved.');
      const response = await axios.get(`${API}/policies`, { headers });
      setPolicies(response.data.data || []);
    } catch (policyError) { setError(policyError.response?.data?.detail || 'Unable to save attendance policy.'); }
  };

  const calendarDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: count }, (_, index) => { const day = `${month.getFullYear()}-${pad(month.getMonth() + 1)}-${pad(index + 1)}`; return { day, record: records.find((item) => item.attendance_date === day) }; });
  }, [month, records]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold uppercase tracking-wider text-orange-600">HRMS</p><h1 className="mt-1 text-3xl font-bold text-gray-900">Attendance</h1><p className="mt-2 text-gray-600">Track working time, attendance states, and correction approvals.</p></div>{canSelfTrack && <div className="flex gap-2"><button type="button" onClick={() => check('check-in')} className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white"><LogIn className="h-4 w-4" />Check in</button><button type="button" onClick={() => check('check-out')} className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-sm font-semibold text-white"><LogOut className="h-4 w-4" />Check out</button></div>}</div>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}{message && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}

      <div className="grid gap-4 sm:grid-cols-3">{[['Days recorded', summary.days, CalendarDays], ['Working hours', summary.total_hours, Clock3], ['Present', summary.counts.PRESENT || 0, CheckCircle2]].map(([label, value, Icon]) => <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-orange-500" /><p className="mt-4 text-2xl font-bold text-gray-900">{value}</p><p className="text-sm text-gray-500">{label}</p></div>)}</div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-4"><input type="date" value={filters.date_from} onChange={(event) => setFilters({ ...filters, date_from: event.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" /><input type="date" value={filters.date_to} onChange={(event) => setFilters({ ...filters, date_to: event.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" /><select value={filters.employee_id} onChange={(event) => setFilters({ ...filters, employee_id: event.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="">All employees</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name}</option>)}</select><input placeholder="Department" value={filters.department} onChange={(event) => setFilters({ ...filters, department: event.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div></div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><CalendarDays className="h-5 w-5 text-orange-500" />Monthly calendar</h2><div className="flex items-center gap-2"><button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded border px-2 py-1 text-sm">Previous</button><span className="min-w-32 text-center text-sm font-medium">{month.toLocaleString('default', { month: 'long', year: 'numeric' })}</span><button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded border px-2 py-1 text-sm">Next</button></div></div><div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-gray-500">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}{calendarDays.map(({ day, record }) => <div key={day} className={`min-h-16 rounded border p-2 text-left ${record?.status === 'PRESENT' ? 'border-green-200 bg-green-50' : record ? 'border-orange-200 bg-orange-50' : 'border-gray-100'}`}><p className="font-semibold text-gray-700">{Number(day.slice(-2))}</p><p className="mt-1 truncate text-[10px] text-gray-500">{record?.status || '-'}</p></div>)}</div></div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b px-5 py-4"><h2 className="font-semibold text-gray-900">Attendance table</h2><button type="button" onClick={load} className="flex items-center gap-1 text-sm text-orange-600"><RefreshCw className="h-4 w-4" />Refresh</button></div><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Employee</th><th className="px-5 py-3">Check in</th><th className="px-5 py-3">Check out</th><th className="px-5 py-3">Hours</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Source</th></tr></thead><tbody>{loading ? <tr><td colSpan="7" className="px-5 py-8 text-center text-gray-500">Loading attendance...</td></tr> : records.map((record) => <tr key={record.id} className="border-t"><td className="px-5 py-3">{record.attendance_date}</td><td className="px-5 py-3">{record.employee_name || '-'}</td><td className="px-5 py-3">{record.check_in ? new Date(record.check_in).toLocaleTimeString() : '-'}</td><td className="px-5 py-3">{record.check_out ? new Date(record.check_out).toLocaleTimeString() : '-'}</td><td className="px-5 py-3">{record.total_working_hours || 0}</td><td className="px-5 py-3"><span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">{record.status}</span></td><td className="px-5 py-3">{record.source || '-'}</td></tr>)}{!loading && !records.length && <tr><td colSpan="7" className="px-5 py-8 text-center text-gray-500">No attendance records found.</td></tr>}</tbody></table></div></div>

      {hasPermission('attendance.regularize') && <form onSubmit={submitCorrection} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-gray-900">Request attendance correction</h2><div className="mt-4 grid gap-3 md:grid-cols-4"><input required type="date" value={correction.attendance_date} onChange={(event) => setCorrection({ ...correction, attendance_date: event.target.value })} className="rounded-lg border px-3 py-2 text-sm" /><input type="datetime-local" value={correction.requested_check_in} onChange={(event) => setCorrection({ ...correction, requested_check_in: event.target.value })} className="rounded-lg border px-3 py-2 text-sm" /><input type="datetime-local" value={correction.requested_check_out} onChange={(event) => setCorrection({ ...correction, requested_check_out: event.target.value })} className="rounded-lg border px-3 py-2 text-sm" /><select value={correction.requested_status} onChange={(event) => setCorrection({ ...correction, requested_status: event.target.value })} className="rounded-lg border px-3 py-2 text-sm">{states.map((state) => <option key={state}>{state}</option>)}</select></div><textarea required minLength="5" placeholder="Reason for correction" value={correction.reason} onChange={(event) => setCorrection({ ...correction, reason: event.target.value })} className="mt-3 w-full rounded-lg border px-3 py-2 text-sm" rows="2" /><button type="submit" className="mt-3 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white">Submit correction</button></form>}

      {canApprove && <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-gray-900">Pending correction requests</h2><div className="mt-4 space-y-3">{corrections.filter((item) => item.status === 'pending').map((item) => <div key={item.id} className="flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"><div><p className="font-medium text-gray-900">{item.attendance_date}</p><p className="text-sm text-gray-500">{item.reason}</p></div><div className="flex gap-2"><button type="button" onClick={() => decide(item.id, 'approved')} className="flex items-center gap-1 rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white"><CheckCircle2 className="h-4 w-4" />Approve</button><button type="button" onClick={() => decide(item.id, 'rejected')} className="flex items-center gap-1 rounded border border-red-300 px-3 py-2 text-sm font-semibold text-red-700"><XCircle className="h-4 w-4" />Reject</button></div></div>)}{!corrections.filter((item) => item.status === 'pending').length && <p className="text-sm text-gray-500">No pending correction requests.</p>}</div></section>}

      {hasPermission('attendance.manage') && !isEmployeeOnly && <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-gray-900">Attendance policies</h2><form onSubmit={savePolicy} className="mt-4 grid gap-3 md:grid-cols-5"><input required value={policy.name} onChange={(event) => setPolicy({ ...policy, name: event.target.value })} placeholder="Policy name" className="rounded-lg border px-3 py-2 text-sm" /><input type="number" step="0.25" min="0" max="24" value={policy.workday_hours} onChange={(event) => setPolicy({ ...policy, workday_hours: event.target.value })} placeholder="Workday hours" className="rounded-lg border px-3 py-2 text-sm" /><input type="number" min="0" max="720" value={policy.late_grace_minutes} onChange={(event) => setPolicy({ ...policy, late_grace_minutes: event.target.value })} placeholder="Grace minutes" className="rounded-lg border px-3 py-2 text-sm" /><input type="number" step="0.25" min="0" max="24" value={policy.half_day_hours} onChange={(event) => setPolicy({ ...policy, half_day_hours: event.target.value })} placeholder="Half-day hours" className="rounded-lg border px-3 py-2 text-sm" /><button type="submit" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white">Save policy</button></form><div className="mt-4 space-y-2">{policies.map((item) => <div key={item.id} className="rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700"><span className="font-semibold">{item.name}</span> · {item.workday_hours}h workday · {item.late_grace_minutes}m grace · {item.half_day_hours}h half day · overtime after {item.overtime_after_hours}h</div>)}</div></section>}
    </section>
  );
};

export default AttendanceManagement;
