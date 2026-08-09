'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Admin login failed');
        return;
      }

      router.push('/admin');
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 font-bold text-2xl mb-3 border border-purple-500/30">
          🛡️
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Super Admin Portal</h2>
        <p className="text-xs text-surface-400 mt-1">Platform management and organization access control</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-card py-8 px-6 shadow-2xl rounded-2xl border border-purple-900/40">
          {error && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleAdminLogin}>
            <div>
              <label className="block text-xs font-medium text-purple-300 uppercase tracking-wider mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-300 uppercase tracking-wider mb-1">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm rounded-lg shadow-lg shadow-purple-600/30 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Authenticate Super Admin'
              )}
            </button>
          </form>

          <div className="mt-4 p-3 bg-purple-950/40 rounded border border-purple-800/50 text-[11px] text-purple-300">
            <strong>Security Notice:</strong> No public admin registration exists. Role verification is performed strictly server-side.
          </div>
        </div>
      </div>
    </div>
  );
}
