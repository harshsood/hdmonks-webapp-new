import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useHRMSAuth } from '../../contexts/HRMSAuthContext';

const HRMSLogin = () => {
  const { isAuthenticated, login } = useHRMSAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/hrms/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier || !password) {
      setError('Enter your email/username and password.');
      return;
    }

    setLoading(true);
    const result = await login(normalizedIdentifier, password, rememberMe);
    setLoading(false);

    if (result.success) {
      navigate('/hrms/dashboard', { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
            <ShieldCheck className="h-7 w-7 text-orange-600" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-gray-900">HRMS sign in</h1>
          <p className="mt-2 text-sm text-gray-600">Use an account explicitly granted HRMS access.</p>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Email or username</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                autoComplete="username"
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                required
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Password</span>
            <span className="relative block">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                required
              />
            </span>
          </label>

          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 accent-orange-500"
              />
              Remember me
            </label>
            <button type="button" className="text-orange-600 hover:text-orange-700" onClick={() => setError('Contact your HRMS administrator to reset your password.')}>Forgot password?</button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <Link to="/" className="mt-6 block text-center text-sm text-gray-500 hover:text-orange-600">Return to HD MONKS</Link>
      </section>
    </main>
  );
};

export default HRMSLogin;
