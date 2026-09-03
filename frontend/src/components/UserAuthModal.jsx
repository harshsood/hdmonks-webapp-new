import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { useUserAuth } from '../contexts/UserAuthContext';

const UserAuthModal = ({ open, onOpenChange }) => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useUserAuth();
  const navigate = useNavigate();

  const updateField = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const result = mode === 'login'
      ? await login(form.email, form.password)
      : await register(form.fullName, form.email, form.password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    navigate('/dashboard');
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-900">{mode === 'login' ? 'Welcome back' : 'Create your account'}</DialogTitle>
          <DialogDescription>
            {mode === 'login' ? 'Sign in to access your HD MONKS workspace.' : 'Start managing your work with a personal HD MONKS workspace.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
          {['login', 'register'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => switchMode(item)}
              className={`rounded-md px-3 py-2 text-sm font-semibold capitalize ${mode === item ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}
            >
              {item}
            </button>
          ))}
        </div>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <label className="block text-sm font-medium text-gray-700">
              Full name
              <input value={form.fullName} onChange={updateField('fullName')} required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
            </label>
          )}
          <label className="block text-sm font-medium text-gray-700">
            Email address
            <input type="email" value={form.email} onChange={updateField('email')} required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Password
            <input type="password" minLength={8} value={form.password} onChange={updateField('password')} required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
          </label>
          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-orange-500 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
            {submitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserAuthModal;
