import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useHRMSAuth } from '../../contexts/HRMSAuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/hrms/employees`;
const initialForm = { employee_code: '', first_name: '', last_name: '', date_of_birth: '', gender: '', personal_email: '', work_email: '', phone: '', date_of_joining: '', employment_type: 'full_time', department: '', team_id: '', designation: '', manager_user_id: '', manager_employee_id: '', branch: '', location: '', probation_period_days: '', confirmation_date: '', notice_period_days: '', user_id: '', bank_name: '', bank_account_number: '', bank_ifsc: '', payment_method: 'bank_transfer', tax_information: {} };

const Field = ({ label, name, value, onChange, type = 'text', required = false, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500"> *</span>}</span>
    {children || <input name={name} value={value || ''} onChange={onChange} type={type} required={required} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />}
  </label>
);

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, hasPermission, refreshKey } = useHRMSAuth();
  const isEdit = Boolean(id);
  const canEditSalary = hasPermission('salary.update');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return undefined;
    const loadEmployee = async () => {
      try {
        const response = await axios.get(`${API}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setForm((current) => ({ ...current, ...response.data.data }));
      } catch (loadError) {
        setError(loadError.response?.data?.detail || 'Unable to load employee.');
      } finally {
        setLoading(false);
      }
    };
    loadEmployee();
    return undefined;
  }, [id, isEdit, token, refreshKey]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveEmployee = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.employee_code.trim() || !form.first_name.trim() || !form.last_name.trim() || !form.date_of_joining) {
      setError('Employee ID, first name, last name, and joining date are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((field) => {
        if (typeof payload[field] === 'string') payload[field] = payload[field].trim();
      });
      ['probation_period_days', 'notice_period_days'].forEach((field) => {
        if (payload[field] === '') delete payload[field];
        else if (payload[field] !== undefined) payload[field] = Number(payload[field]);
      });
      Object.keys(payload).forEach((field) => {
        if (payload[field] === '') delete payload[field];
      });
      ['address', 'emergency_contact', 'tax_information'].forEach((field) => {
        if (payload[field] && typeof payload[field] === 'object') {
          Object.keys(payload[field]).forEach((key) => {
            if (typeof payload[field][key] === 'string') payload[field][key] = payload[field][key].trim();
            if (payload[field][key] === '') delete payload[field][key];
          });
          if (!Object.keys(payload[field]).length) delete payload[field];
        }
      });
      if (!payload.bank_name && !payload.bank_account_number && !payload.bank_ifsc && !payload.tax_information) {
        delete payload.payment_method;
      }
      if (!hasPermission('employees.update')) {
        const selfServiceFields = ['profile_photo_url', 'personal_email', 'phone', 'address', 'emergency_contact'];
        Object.keys(payload).forEach((field) => {
          if (!selfServiceFields.includes(field)) delete payload[field];
        });
      }
      if (!canEditSalary) {
        Object.keys(payload).filter((field) => ['bank_name', 'bank_account_number', 'bank_ifsc', 'payment_method', 'tax_information'].includes(field)).forEach((field) => delete payload[field]);
      }
      const response = isEdit
        ? await axios.put(`${API}/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } })
        : await axios.post(API, payload, { headers: { Authorization: `Bearer ${token}` } });
      navigate(`/hrms/employees/${response.data.data.id}`);
    } catch (saveError) {
      setError(saveError.response?.data?.detail || 'Unable to save employee.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading employee...</div>;

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <Link to={isEdit ? `/hrms/employees/${id}` : '/hrms/employees'} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-orange-600"><ArrowLeft className="h-4 w-4" />Back</Link>
      <div><p className="text-sm font-semibold uppercase tracking-wider text-orange-600">HRMS / Employees</p><h1 className="mt-1 text-3xl font-bold text-gray-900">{isEdit ? 'Edit employee' : 'New employee'}</h1></div>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={saveEmployee} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold text-gray-900">Personal Information</h2><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><Field label="Employee ID" name="employee_code" value={form.employee_code} onChange={handleChange} required /><Field label="First name" name="first_name" value={form.first_name} onChange={handleChange} required /><Field label="Last name" name="last_name" value={form.last_name} onChange={handleChange} required /><Field label="Profile photo URL" name="profile_photo_url" value={form.profile_photo_url} onChange={handleChange} /><Field label="Date of birth" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} type="date" /><Field label="Gender" name="gender" value={form.gender} onChange={handleChange}><select name="gender" value={form.gender || ''} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"><option value="">Select gender</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option><option value="prefer_not_to_say">Prefer not to say</option></select></Field><Field label="Personal email" name="personal_email" value={form.personal_email} onChange={handleChange} type="email" /><Field label="Work email" name="work_email" value={form.work_email} onChange={handleChange} type="email" /><Field label="Phone" name="phone" value={form.phone} onChange={handleChange} /></div><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Address line" name="address_line" value={form.address?.line || ''} onChange={(event) => setForm((current) => ({ ...current, address: { ...(current.address || {}), line: event.target.value } }))} /><Field label="Emergency contact" name="emergency_name" value={form.emergency_contact?.name || ''} onChange={(event) => setForm((current) => ({ ...current, emergency_contact: { ...(current.emergency_contact || {}), name: event.target.value } }))} /></div></div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold text-gray-900">Employment Information</h2><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><Field label="Date of joining" name="date_of_joining" value={form.date_of_joining} onChange={handleChange} type="date" required /><Field label="Employment type" name="employment_type" value={form.employment_type} onChange={handleChange}><select name="employment_type" value={form.employment_type} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option><option value="intern">Intern</option><option value="consultant">Consultant</option></select></Field><Field label="Department" name="department" value={form.department} onChange={handleChange} /><Field label="Team ID" name="team_id" value={form.team_id} onChange={handleChange} /><Field label="Designation" name="designation" value={form.designation} onChange={handleChange} /><Field label="Manager employee ID" name="manager_employee_id" value={form.manager_employee_id} onChange={handleChange} /><Field label="Manager user ID" name="manager_user_id" value={form.manager_user_id} onChange={handleChange} /><Field label="Branch" name="branch" value={form.branch} onChange={handleChange} /><Field label="Location" name="location" value={form.location} onChange={handleChange} /><Field label="Probation days" name="probation_period_days" value={form.probation_period_days} onChange={handleChange} type="number" /><Field label="Confirmation date" name="confirmation_date" value={form.confirmation_date} onChange={handleChange} type="date" /><Field label="Notice period days" name="notice_period_days" value={form.notice_period_days} onChange={handleChange} type="number" /><Field label="Linked user ID" name="user_id" value={form.user_id} onChange={handleChange} /></div></div>

        {canEditSalary && <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold text-gray-900">Bank / Payroll Information</h2><p className="mt-1 text-sm text-gray-500">Visible only to authorized payroll and finance roles.</p><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><Field label="Bank name" name="bank_name" value={form.bank_name} onChange={handleChange} /><Field label="Account number" name="bank_account_number" value={form.bank_account_number} onChange={handleChange} /><Field label="IFSC" name="bank_ifsc" value={form.bank_ifsc} onChange={handleChange} /><Field label="Payment method" name="payment_method" value={form.payment_method} onChange={handleChange}><select name="payment_method" value={form.payment_method || ''} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"><option value="">Select payment method</option><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option><option value="cheque">Cheque</option></select></Field><Field label="Tax identifier" name="tax_identifier" value={form.tax_information?.tax_identifier || ''} onChange={(event) => setForm((current) => ({ ...current, tax_information: { ...(current.tax_information || {}), tax_identifier: event.target.value } }))} /></div></div>}

        <div className="flex justify-end gap-3"><Link to={isEdit ? `/hrms/employees/${id}` : '/hrms/employees'} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700">Cancel</Link><button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save employee'}</button></div>
      </form>
    </section>
  );
};

export default EmployeeForm;
