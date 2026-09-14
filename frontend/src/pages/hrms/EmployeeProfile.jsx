import React, { useCallback, useEffect, useState } from 'react';
import { Archive, ArrowLeft, Edit3, FileText, RotateCcw, ShieldAlert, Upload } from 'lucide-react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useHRMSAuth } from '../../contexts/HRMSAuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/hrms/employees`;
const documentTypes = [
  ['offer_letter', 'Offer letter'],
  ['appointment_letter', 'Appointment letter'],
  ['id_document', 'ID document'],
  ['certificate', 'Certificate'],
  ['contract', 'Contract'],
  ['salary_revision', 'Salary revision'],
];

const Row = ({ label, value }) => <div><dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt><dd className="mt-1 break-words font-medium text-gray-900">{value || '-'}</dd></div>;

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user, hasPermission } = useHRMSAuth();
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const loadProfile = useCallback(async () => {
    const requestHeaders = { Authorization: `Bearer ${token}` };
    setLoading(true);
    try {
      const requests = [axios.get(`${API}/${id}`, { headers: requestHeaders }), axios.get(`${API}/${id}/timeline`, { headers: requestHeaders })];
      if (hasPermission('documents.view')) requests.push(axios.get(`${API}/${id}/documents`, { headers: requestHeaders }));
      const responses = await Promise.all(requests);
      setEmployee(responses[0].data.data);
      setTimeline(responses[1].data.data || []);
      setDocuments(responses[2]?.data.data || []);
    } catch (loadError) {
      setError(loadError.response?.data?.detail || 'Unable to load employee profile.');
    } finally {
      setLoading(false);
    }
  }, [hasPermission, id, token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const isOwnRecord = employee?.user_id === user?.id;
  const canEdit = hasPermission('employees.update') || isOwnRecord;

  const changeStatus = async (status) => {
    setError('');
    setMessage('');
    try {
      const response = await axios.post(`${API}/${id}/status`, { status }, { headers });
      setEmployee(response.data.data);
      setMessage(`Employee ${status} successfully.`);
      await loadProfile();
    } catch (statusError) {
      setError(statusError.response?.data?.detail || 'Unable to update employee status.');
    }
  };

  const uploadDocument = (event, documentType) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10_000_000) {
      setError('Documents must be 10 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await axios.post(`${API}/${id}/documents`, { document_type: documentType, file_name: file.name, file_type: file.type, file_size: file.size, file_data: reader.result }, { headers });
        setMessage('Document uploaded successfully.');
        await loadProfile();
      } catch (uploadError) {
        setError(uploadError.response?.data?.detail || 'Unable to upload document.');
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  if (loading) return <div className="p-8 text-gray-500">Loading employee profile...</div>;
  if (!employee) return <div className="p-8 text-red-700">{error || 'Employee not found.'}</div>;

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <Link to="/hrms/employees" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-orange-600"><ArrowLeft className="h-4 w-4" />Back to employees</Link>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}

      <div className="flex flex-col justify-between gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start">
        <div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-xl font-bold text-orange-600">{employee.profile_photo_url ? <img src={employee.profile_photo_url} alt="" className="h-full w-full object-cover" /> : `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`}</div><div><p className="font-mono text-xs text-gray-500">{employee.employee_code}</p><h1 className="mt-1 text-3xl font-bold text-gray-900">{employee.first_name} {employee.last_name}</h1><p className="mt-1 text-gray-600">{employee.designation || 'Employee'}{employee.department ? ` · ${employee.department}` : ''}</p></div></div>
        <div className="flex flex-wrap gap-2">{canEdit && <Link to={`/hrms/employees/${id}/edit`} className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><Edit3 className="h-4 w-4" />Edit</Link>}{hasPermission('employees.update') && employee.employment_status === 'active' && <button type="button" onClick={() => changeStatus('inactive')} className="rounded-lg border border-yellow-300 px-3 py-2 text-sm font-semibold text-yellow-700">Deactivate</button>}{hasPermission('employees.update') && employee.employment_status === 'inactive' && <button type="button" onClick={() => changeStatus('active')} className="flex items-center gap-2 rounded-lg border border-green-300 px-3 py-2 text-sm font-semibold text-green-700"><RotateCcw className="h-4 w-4" />Reactivate</button>}{hasPermission('employees.delete') && employee.employment_status !== 'archived' && <button type="button" onClick={() => changeStatus('archived')} className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700"><Archive className="h-4 w-4" />Archive</button>}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold text-gray-900">Personal Information</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2"><Row label="Employee ID" value={employee.employee_code} /><Row label="Date of birth" value={employee.date_of_birth} /><Row label="Gender" value={employee.gender} /><Row label="Personal email" value={employee.personal_email} /><Row label="Work email" value={employee.work_email} /><Row label="Phone" value={employee.phone} /><Row label="Address" value={employee.address?.line} /><Row label="Emergency contact" value={employee.emergency_contact?.name} /></dl></section>
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold text-gray-900">Employment Information</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2"><Row label="Date of joining" value={employee.date_of_joining} /><Row label="Employment type" value={employee.employment_type} /><Row label="Department" value={employee.department} /><Row label="Designation" value={employee.designation} /><Row label="Manager" value={employee.manager_user_id} /><Row label="Branch" value={employee.branch} /><Row label="Location" value={employee.location} /><Row label="Probation" value={employee.probation_period_days ? `${employee.probation_period_days} days` : '-'} /><Row label="Confirmation date" value={employee.confirmation_date} /><Row label="Notice period" value={employee.notice_period_days ? `${employee.notice_period_days} days` : '-'} /><Row label="Status" value={employee.employment_status} /></dl></section>
      </div>

      {(hasPermission('salary.view') || employee.bank_name) && <section className="rounded-xl border border-red-200 bg-red-50 p-6"><div className="flex items-center gap-2 text-red-800"><ShieldAlert className="h-5 w-5" /><h2 className="text-xl font-semibold">Bank / Payroll Information</h2></div>{hasPermission('salary.view') ? <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-5"><Row label="Bank name" value={employee.bank_name} /><Row label="Account number" value={employee.bank_account_number ? `••••${employee.bank_account_number.slice(-4)}` : '-'} /><Row label="IFSC" value={employee.bank_ifsc} /><Row label="Payment method" value={employee.payment_method} /><Row label="Tax identifier" value={employee.tax_information?.tax_identifier} /></dl> : <p className="mt-3 text-sm text-red-700">Financial details are restricted to authorized payroll and finance roles.</p>}</section>}

      {hasPermission('documents.view') && <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-gray-900">Documents</h2>{hasPermission('documents.upload') && <span className="text-sm text-gray-500">Maximum file size: 10 MB</span>}</div><div className="mt-5 grid gap-3 md:grid-cols-2">{documentTypes.map(([type, label]) => { const document = documents.find((item) => item.document_type === type); const allowed = type !== 'salary_revision' || hasPermission('salary.update'); return <div key={type} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-4"><div className="flex min-w-0 items-center gap-3"><FileText className="h-5 w-5 shrink-0 text-orange-500" /><div className="min-w-0"><p className="font-medium text-gray-900">{label}</p><p className="truncate text-xs text-gray-500">{document?.file_name || 'Not uploaded'}</p></div></div>{hasPermission('documents.upload') && allowed && <label className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-orange-200 px-2 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50"><Upload className="h-3.5 w-3.5" />Upload<input type="file" onChange={(event) => uploadDocument(event, type)} className="sr-only" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" /></label>}</div>})}</div></section>}

      {hasPermission('employees.view') && <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold text-gray-900">Activity timeline</h2><div className="mt-5 space-y-4">{timeline.map((activity) => <div key={activity.id} className="border-l-2 border-orange-200 pl-4"><p className="font-medium text-gray-900">{activity.summary}</p><p className="mt-1 text-xs text-gray-500">{new Date(activity.created_at).toLocaleString()}</p></div>)}{!timeline.length && <p className="text-sm text-gray-500">No activity recorded yet.</p>}</div></section>}
    </section>
  );
};

export default EmployeeProfile;
