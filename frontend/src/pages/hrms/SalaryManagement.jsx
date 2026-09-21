import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { History, LockKeyhole, Save, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { useHRMSAuth } from '../../contexts/HRMSAuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/hrms/salary`;
const earningCodes = ['BASIC', 'HRA', 'CONVEYANCE', 'SPECIAL_ALLOWANCE', 'MEDICAL_ALLOWANCE', 'OTHER_ALLOWANCE', 'BONUS', 'INCENTIVE', 'OVERTIME'];
const deductionCodes = ['PF', 'ESI', 'PROFESSIONAL_TAX', 'TDS', 'LOAN', 'ADVANCE', 'OTHER_DEDUCTION'];
const blankComponent = (componentType, code) => ({ name: code, component_type: componentType, code, amount: 0, percentage: null, calculation_base: null, is_variable: false });

const SalaryManagement = () => {
  const { token, roles, hasPermission, user, refreshKey } = useHRMSAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [salary, setSalary] = useState(null);
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({ template_id: '', effective_date: '', ctc: '', gross_salary: '', net_salary: '', change_type: 'initial', change_reason: '', earnings: [blankComponent('earning', 'BASIC')], deductions: [] });
  const [template, setTemplate] = useState({ name: '', description: '', earnings: [blankComponent('earning', 'BASIC')], deductions: [] });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const canManage = hasPermission('salary.create') || hasPermission('salary.update');
  const canCreateTemplate = hasPermission('salary.create');
  const canViewAny = hasPermission('salary.view');
  const canAccessSalary = canViewAny || roles.includes('employee');

  const loadSalary = useCallback(async (employeeId) => {
    if (!employeeId) return;
    try {
      const [salaryResponse, historyResponse] = await Promise.all([axios.get(`${API}/employees/${employeeId}`, { headers }), axios.get(`${API}/employees/${employeeId}/history`, { headers })]);
      setSalary(salaryResponse.data.data);
      setHistory(historyResponse.data.data || []);
    } catch (loadError) { setError(loadError.response?.data?.detail || 'Unable to load salary information.'); }
  }, [headers]);

  useEffect(() => {
    const load = async () => {
      if (!canAccessSalary) return;
      try {
        if (canViewAny) {
          const employeeResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/hrms/employees?page_size=100`, { headers });
          const list = employeeResponse.data.data || [];
          setEmployees(list);
          if (list[0]) setSelectedEmployee(list[0].id);
          const templateResponse = await axios.get(`${API}/templates`, { headers });
          setTemplates(templateResponse.data.data || []);
        } else {
          const employeeResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/hrms/employees?page_size=100`, { headers });
          const own = (employeeResponse.data.data || []).find((employee) => employee.user_id === user?.id);
          if (own) setSelectedEmployee(own.id);
        }
      } catch (loadError) { setError(loadError.response?.data?.detail || 'Unable to load salary workspace.'); }
    };
    load();
  }, [headers, canAccessSalary, canViewAny, user, refreshKey]);

  useEffect(() => { if (selectedEmployee) loadSalary(selectedEmployee); }, [selectedEmployee, loadSalary]);

  const saveAssignment = async (event) => {
    event.preventDefault();
    try {
      const path = salary ? `${API}/employees/${selectedEmployee}/revision` : `${API}/employees/${selectedEmployee}`;
      await axios.post(path, { ...form, template_id: form.template_id || null, ctc: Number(form.ctc), gross_salary: Number(form.gross_salary), net_salary: Number(form.net_salary) }, { headers });
      setMessage(salary ? 'Salary revision saved.' : 'Salary assigned.');
      await loadSalary(selectedEmployee);
    } catch (saveError) { setError(saveError.response?.data?.detail || 'Unable to save salary.'); }
  };

  const saveTemplate = async (event) => {
    event.preventDefault();
    try { await axios.post(`${API}/templates`, template, { headers }); setMessage('Salary template saved.'); const response = await axios.get(`${API}/templates`, { headers }); setTemplates(response.data.data || []); } catch (templateError) { setError(templateError.response?.data?.detail || 'Unable to save salary template.'); }
  };

  return (
    <section className="space-y-6">
      <div><p className="text-sm font-semibold uppercase tracking-wider text-orange-600">HRMS / Restricted</p><h1 className="mt-1 text-3xl font-bold text-gray-900">Salary management</h1><p className="mt-2 text-gray-600">Salary data is protected by backend field-level authorization.</p></div>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}{message && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
      {!canAccessSalary && <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-red-800"><LockKeyhole className="h-5 w-5" /><p>Salary access is restricted for your role.</p></div>}
      {!canViewAny && <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-800"><LockKeyhole className="h-5 w-5" /><p>You can view only your own salary information.</p></div>}
      {canViewAny && <label className="block max-w-xl text-sm"><span className="mb-1 block font-medium">Employee</span><select value={selectedEmployee} onChange={(event) => setSelectedEmployee(event.target.value)} className="w-full rounded-lg border px-3 py-2.5">{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name} · {employee.employee_code}</option>)}</select></label>}

      <section className="rounded-xl border border-red-200 bg-red-50 p-6"><div className="flex items-center gap-2 text-red-800"><ShieldAlert className="h-5 w-5" /><h2 className="text-xl font-semibold">Current salary</h2></div>{salary ? <div className="mt-5 grid gap-5 sm:grid-cols-3"><div><p className="text-xs uppercase text-gray-500">CTC</p><p className="mt-1 text-2xl font-bold">{salary.ctc}</p></div><div><p className="text-xs uppercase text-gray-500">Gross salary</p><p className="mt-1 text-2xl font-bold">{salary.gross_salary}</p></div><div><p className="text-xs uppercase text-gray-500">Net salary</p><p className="mt-1 text-2xl font-bold">{salary.net_salary}</p></div></div> : <p className="mt-4 text-sm text-red-700">No salary assignment exists for this employee.</p>}</section>

      {canManage && selectedEmployee && <form onSubmit={saveAssignment} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">{salary ? 'Create salary revision' : 'Assign salary'}</h2><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4"><input required type="date" value={form.effective_date} onChange={(event) => setForm({ ...form, effective_date: event.target.value })} className="rounded-lg border px-3 py-2.5" /><input required type="number" min="0" value={form.ctc} onChange={(event) => setForm({ ...form, ctc: event.target.value })} placeholder="CTC" className="rounded-lg border px-3 py-2.5" /><input required type="number" min="0" value={form.gross_salary} onChange={(event) => setForm({ ...form, gross_salary: event.target.value })} placeholder="Gross salary" className="rounded-lg border px-3 py-2.5" /><input required type="number" min="0" value={form.net_salary} onChange={(event) => setForm({ ...form, net_salary: event.target.value })} placeholder="Net salary" className="rounded-lg border px-3 py-2.5" /></div><select value={form.change_type} onChange={(event) => setForm({ ...form, change_type: event.target.value })} className="mt-4 rounded-lg border px-3 py-2.5"><option value="initial">Initial</option><option value="revision">Revision</option><option value="increment">Increment</option><option value="promotion">Promotion</option></select><textarea value={form.change_reason} onChange={(event) => setForm({ ...form, change_reason: event.target.value })} placeholder="Change reason" className="mt-4 w-full rounded-lg border px-3 py-2.5" rows="2" /><button type="submit" className="mt-4 flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 font-semibold text-white"><Save className="h-4 w-4" />Save salary</button></form>}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-xl font-semibold"><History className="h-5 w-5 text-orange-500" />Salary history</h2><div className="mt-4 divide-y">{history.map((item) => <div key={item.id} className="grid gap-2 py-3 text-sm sm:grid-cols-5"><span>{item.effective_date}</span><span>{item.change_type}</span><span>CTC: {item.ctc}</span><span>Gross: {item.gross_salary}</span><span>Net: {item.net_salary}</span></div>)}{!history.length && <p className="py-4 text-sm text-gray-500">No salary history.</p>}</div></section>

      {canCreateTemplate && <form onSubmit={saveTemplate} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Salary templates</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><input required value={template.name} onChange={(event) => setTemplate({ ...template, name: event.target.value })} placeholder="Template name" className="rounded-lg border px-3 py-2.5" /><input value={template.description} onChange={(event) => setTemplate({ ...template, description: event.target.value })} placeholder="Description" className="rounded-lg border px-3 py-2.5" /></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><div><p className="mb-2 text-sm font-semibold">Earnings</p>{earningCodes.map((code) => <label key={code} className="mr-2 inline-flex items-center gap-1 text-xs"><input type="checkbox" checked={template.earnings.some((item) => item.code === code)} onChange={(event) => setTemplate({ ...template, earnings: event.target.checked ? [...template.earnings, blankComponent('earning', code)] : template.earnings.filter((item) => item.code !== code) })} />{code}</label>)}</div><div><p className="mb-2 text-sm font-semibold">Deductions</p>{deductionCodes.map((code) => <label key={code} className="mr-2 inline-flex items-center gap-1 text-xs"><input type="checkbox" checked={template.deductions.some((item) => item.code === code)} onChange={(event) => setTemplate({ ...template, deductions: event.target.checked ? [...template.deductions, blankComponent('deduction', code)] : template.deductions.filter((item) => item.code !== code) })} />{code}</label>)}</div></div><button type="submit" className="mt-4 rounded-lg bg-gray-900 px-4 py-2.5 font-semibold text-white">Save template</button><div className="mt-4 space-y-2">{templates.map((item) => <p key={item.id} className="rounded border px-3 py-2 text-sm">{item.name} · {item.earnings?.length || 0} earnings · {item.deductions?.length || 0} deductions</p>)}</div></form>}
    </section>
  );
};

export default SalaryManagement;
