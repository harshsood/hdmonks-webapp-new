import React, { useCallback, useEffect, useState } from 'react';
import { Download, Edit3, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useHRMSAuth } from '../../contexts/HRMSAuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/hrms/employees`;
const emptyFilters = { search: '', department: '', designation: '', location: '', employment_status: '', employment_type: '', joining_date_from: '', joining_date_to: '' };

const EmployeeList = () => {
  const { token, hasPermission } = useHRMSAuth();
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [options, setOptions] = useState({ departments: [], designations: [], locations: [] });
  const [sort, setSort] = useState({ sort_by: 'created_at', sort_order: 'desc' });
  const [pagination, setPagination] = useState({ page: 1, page_size: 25, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const buildParams = useCallback((page = 1) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pagination.page_size), sort_by: sort.sort_by, sort_order: sort.sort_order });
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
    return params;
  }, [filters, pagination.page_size, sort]);

  const loadEmployees = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API}?${buildParams(page).toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      setEmployees(response.data.data || []);
      setPagination(response.data.pagination || { page, page_size: 25, total: 0, pages: 1 });
    } catch (loadError) {
      setError(loadError.response?.data?.detail || 'Unable to load employees.');
    } finally {
      setLoading(false);
    }
  }, [buildParams, token]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await axios.get(`${API}/filters`, { headers: { Authorization: `Bearer ${token}` } });
        setOptions(response.data.data || { departments: [], designations: [], locations: [] });
      } catch (loadError) {
        setError(loadError.response?.data?.detail || 'Unable to load employee filters.');
      }
    };
    loadOptions();
  }, [token]);

  useEffect(() => {
    loadEmployees(1);
  }, [filters, sort, loadEmployees]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const resetFilters = () => setFilters(emptyFilters);
  const changeSort = (sortBy) => setSort((current) => ({ sort_by: sortBy, sort_order: current.sort_by === sortBy && current.sort_order === 'asc' ? 'desc' : 'asc' }));

  const exportEmployees = async () => {
    try {
      const response = await axios.get(`${API}/export?${buildParams(1).toString()}`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const url = window.URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'employees.csv';
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError.response?.data?.detail || 'Unable to export employees.');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">HRMS</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Employees</h1>
          <p className="mt-2 text-gray-600">Manage employee records within your authorized scope.</p>
        </div>
        <div className="flex gap-2">
          {hasPermission('employees.export') && <button type="button" onClick={exportEmployees} className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><Download className="h-4 w-4" />Export</button>}
          {hasPermission('employees.create') && <Link to="/hrms/employees/new" className="flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"><Plus className="h-4 w-4" />New employee</Link>}
        </div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800"><SlidersHorizontal className="h-4 w-4 text-orange-500" />Filters</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative sm:col-span-2"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" /><input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search name, employee ID, email" className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-500" /></label>
          <select value={filters.department} onChange={(event) => updateFilter('department', event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"><option value="">All departments</option>{options.departments.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select value={filters.designation} onChange={(event) => updateFilter('designation', event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"><option value="">All designations</option>{options.designations.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select value={filters.location} onChange={(event) => updateFilter('location', event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"><option value="">All locations</option>{options.locations.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select value={filters.employment_status} onChange={(event) => updateFilter('employment_status', event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select>
          <select value={filters.employment_type} onChange={(event) => updateFilter('employment_type', event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"><option value="">All employment types</option><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option><option value="intern">Intern</option><option value="consultant">Consultant</option></select>
          <input type="date" value={filters.joining_date_from} onChange={(event) => updateFilter('joining_date_from', event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" aria-label="Joining date from" />
          <input type="date" value={filters.joining_date_to} onChange={(event) => updateFilter('joining_date_to', event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" aria-label="Joining date to" />
        </div>
        <button type="button" onClick={resetFilters} className="mt-3 text-sm font-medium text-orange-600 hover:text-orange-700">Clear filters</button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {[['employee_code', 'Employee ID'], ['first_name', 'Employee'], ['department', 'Department'], ['designation', 'Designation'], ['location', 'Location'], ['employment_status', 'Status'], ['date_of_joining', 'Joining date']].map(([key, label]) => <th key={key} className="whitespace-nowrap px-4 py-3"><button type="button" onClick={() => changeSort(key)} className="font-semibold hover:text-gray-900">{label}{sort.sort_by === key ? (sort.sort_order === 'asc' ? ' ↑' : ' ↓') : ''}</button></th>)}
                <th className="px-4 py-3"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && <tr><td colSpan="8" className="px-4 py-10 text-center text-gray-500">Loading employees...</td></tr>}
              {!loading && employees.map((employee) => <tr key={employee.id} className="hover:bg-orange-50/30"><td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-gray-600">{employee.employee_code}</td><td className="whitespace-nowrap px-4 py-4"><Link to={`/hrms/employees/${employee.id}`} className="font-semibold text-gray-900 hover:text-orange-600">{employee.first_name} {employee.last_name}</Link><span className="block text-xs text-gray-500">{employee.work_email || employee.personal_email || 'No email'}</span></td><td className="whitespace-nowrap px-4 py-4 text-gray-600">{employee.department || '-'}</td><td className="whitespace-nowrap px-4 py-4 text-gray-600">{employee.designation || '-'}</td><td className="whitespace-nowrap px-4 py-4 text-gray-600">{employee.location || '-'}</td><td className="whitespace-nowrap px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${employee.employment_status === 'active' ? 'bg-green-100 text-green-700' : employee.employment_status === 'archived' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>{employee.employment_status}</span></td><td className="whitespace-nowrap px-4 py-4 text-gray-600">{employee.date_of_joining}</td><td className="px-4 py-4 text-right"><Link to={`/hrms/employees/${employee.id}`} className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700"><Edit3 className="h-4 w-4" />View</Link></td></tr>)}
              {!loading && !employees.length && <tr><td colSpan="8" className="px-4 py-10 text-center text-gray-500">No employees match the selected filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-600"><span>{pagination.total} employee{pagination.total === 1 ? '' : 's'}</span><div className="flex items-center gap-3"><button type="button" disabled={pagination.page <= 1} onClick={() => loadEmployees(pagination.page - 1)} className="rounded border border-gray-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span>Page {pagination.page} of {pagination.pages || 1}</span><button type="button" disabled={pagination.page >= pagination.pages} onClick={() => loadEmployees(pagination.page + 1)} className="rounded border border-gray-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div>
      </div>
    </section>
  );
};

export default EmployeeList;
