'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, orgName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      // Redirect to verification notice page
      router.push(`/verify-email?email=${encodeURIComponent(email)}&registered=true`);
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/20">
            F
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            Field<span className="text-brand-400">Track</span>
          </span>
        </div>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-surface-100">
          Create Manager Account
        </h2>
        <p className="mt-2 text-sm text-surface-400">
          Start tracking field employees with transparent <span className="text-brand-300 font-semibold">₹19/employee/month</span> pricing
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-card py-8 px-4 shadow-2xl rounded-2xl sm:px-10 border border-surface-800">
          {error && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-300 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <label className="block text-xs font-medium text-surface-300 uppercase tracking-wider mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rajesh Sharma"
                className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-300 uppercase tracking-wider mb-1">
                Company / Workspace Name
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Apex Field Services"
                className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-300 uppercase tracking-wider mb-1">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@company.com"
                className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-300 uppercase tracking-wider mb-1">
                Account Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (min 6 chars)"
                className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            <div className="bg-surface-900 p-3 rounded-lg border border-surface-800 text-xs text-surface-400 space-y-1">
              <div className="flex justify-between text-surface-300 font-medium">
                <span>Pricing Model:</span>
                <span className="text-emerald-400 font-semibold">₹19 / employee / month</span>
              </div>
              <p>Email verification is mandatory before access approval by administrator.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-sm rounded-lg shadow-lg shadow-brand-600/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Create Account & Verify Email'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-surface-400">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-400 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
