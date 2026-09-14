import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, ShieldCheck } from 'lucide-react';
import { useHRMSAuth } from '../../contexts/HRMSAuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/hrms`;

const HRMSRoleManagement = () => {
  const { token } = useHRMSAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [usersResponse, rolesResponse] = await Promise.all([
          axios.get(`${API}/users`, { headers }),
          axios.get(`${API}/roles`, { headers }),
        ]);
        const nextUsers = usersResponse.data.data || [];
        setUsers(nextUsers);
        setRoles(rolesResponse.data.data || []);
        if (nextUsers[0]) {
          setSelectedUser(nextUsers[0]);
          setSelectedRoles(nextUsers[0].roles || []);
        }
      } catch (loadError) {
        setError(loadError.response?.data?.detail || 'Unable to load HRMS access settings.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const chooseUser = (user) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles || []);
    setMessage('');
    setError('');
  };

  const toggleRole = (roleKey) => {
    setSelectedRoles((current) => current.includes(roleKey)
      ? current.filter((key) => key !== roleKey)
      : [...current, roleKey]);
  };

  const saveRoles = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.put(`${API}/users/${selectedUser.id}/roles`, { role_keys: selectedRoles }, { headers });
      const authorization = response.data.data;
      setUsers((current) => current.map((user) => user.id === selectedUser.id
        ? { ...user, roles: authorization.roles, permissions: authorization.permissions }
        : user));
      setSelectedUser((current) => ({ ...current, roles: authorization.roles, permissions: authorization.permissions }));
      setMessage('HRMS roles updated successfully.');
    } catch (saveError) {
      setError(saveError.response?.data?.detail || 'Unable to update HRMS roles.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading access settings...</div>;

  return (
    <section className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-orange-500" />
          <h2 className="text-3xl font-bold text-gray-900">HRMS roles and access</h2>
        </div>
        <p className="mt-2 text-gray-600">Assign reusable HRMS roles. Existing application roles are not changed here.</p>
      </div>

      {message && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="font-semibold text-gray-900">Application users</h3>
          <div className="mt-4 space-y-2">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => chooseUser(user)}
                className={`w-full rounded-lg border px-3 py-3 text-left ${selectedUser?.id === user.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}
              >
                <span className="block font-medium text-gray-900">{user.full_name}</span>
                <span className="block text-sm text-gray-500">{user.email}</span>
                <span className="mt-1 block text-xs text-orange-700">{user.roles?.length ? user.roles.join(', ') : 'No HRMS role'}</span>
              </button>
            ))}
            {!users.length && <p className="text-sm text-gray-500">No application users found.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Role assignment</h3>
              <p className="mt-1 text-sm text-gray-500">{selectedUser ? selectedUser.email : 'Select a user'}</p>
            </div>
            <button type="button" onClick={saveRoles} disabled={!selectedUser || saving} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save roles'}
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {roles.map((role) => (
              <label key={role.key} className="rounded-lg border border-gray-200 p-4 hover:border-orange-300">
                <span className="flex items-start gap-3">
                  <input type="checkbox" checked={selectedRoles.includes(role.key)} onChange={() => toggleRole(role.key)} className="mt-1 h-4 w-4 accent-orange-500" />
                  <span>
                    <span className="block font-medium text-gray-900">{role.name}</span>
                    <span className="mt-1 block text-xs text-gray-500">{role.description}</span>
                    <span className="mt-2 block text-xs text-orange-700">{role.permissions.length} permissions</span>
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HRMSRoleManagement;
