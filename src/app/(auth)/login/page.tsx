'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'OWNER' | 'EMPLOYEE'>('OWNER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warningCode, setWarningCode] = useState('');

  const message = searchParams.get('message');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setWarningCode('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        if (data.code) setWarningCode(data.code);

        if (data.code === 'EMAIL_NOT_VERIFIED') {
          setTimeout(() => {
            router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          }, 1500);
        } else if (data.code === 'ACCESS_PENDING') {
          setTimeout(() => router.push('/access-pending'), 1500);
        } else if (data.code === 'ACCESS_EXPIRED') {
          setTimeout(() => router.push('/access-expired'), 1500);
        } else if (data.code === 'ACCESS_REVOKED') {
          setTimeout(() => router.push('/access-revoked'), 1500);
        } else if (data.code === 'ACCESS_SUSPENDED') {
          setTimeout(() => router.push('/access-suspended'), 1500);
        }
        return;
      }

      if (data.redirectTo) {
        router.push(data.redirectTo);
      }
    } catch (err: any) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card py-8 px-4 shadow-2xl rounded-2xl sm:px-10 border border-surface-800">
      {message && (
        <div className="mb-4 p-3 bg-brand-950/80 border border-brand-800 text-brand-300 text-sm rounded-lg">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-300 text-sm rounded-lg flex flex-col gap-1">
          <span className="font-semibold">{error}</span>
          {warningCode && (
            <span className="text-xs text-red-400">Status code: {warningCode}</span>
          )}
        </div>
      )}

      <div className="flex bg-surface-900 rounded-lg p-1 mb-6 border border-surface-800">
        <button
          type="button"
          onClick={() => setRole('OWNER')}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
            role === 'OWNER'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-surface-400 hover:text-surface-200'
          }`}
        >
          Manager / Owner
        </button>
        <button
          type="button"
          onClick={() => setRole('EMPLOYEE')}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
            role === 'EMPLOYEE'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-surface-400 hover:text-surface-200'
          }`}
        >
          Employee App
        </button>
      </div>

      <form className="space-y-5" onSubmit={handleLogin}>
        <div>
          <label className="block text-xs font-medium text-surface-300 uppercase tracking-wider mb-1">
            {role === 'OWNER' ? 'Manager Email' : 'Employee Login Email'}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={role === 'OWNER' ? 'owner@company.com' : 'rahul@demo.com'}
            className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-surface-300 uppercase tracking-wider mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-sm rounded-lg shadow-lg shadow-brand-600/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50 flex justify-center items-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            `Sign in as ${role === 'OWNER' ? 'Manager' : 'Employee'}`
          )}
        </button>
      </form>

      {process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_DEMO_CREDENTIALS === 'true' && (
        <div className="mt-6 pt-6 border-t border-surface-800">
          <p className="text-xs text-surface-400 font-semibold mb-2">⚡ Demo Quick Logins:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setEmail('demo@fieldtrack.com');
                setPassword('demo123');
                setRole('OWNER');
              }}
              className="p-2 bg-surface-900 hover:bg-surface-800 rounded border border-surface-700 text-left text-brand-300 transition-all"
            >
              <span className="font-semibold block">Demo Manager</span>
              <span className="text-[10px] text-surface-400">demo@fieldtrack.com</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('rahul@demo.com');
                setPassword('emp123');
                setRole('EMPLOYEE');
              }}
              className="p-2 bg-surface-900 hover:bg-surface-800 rounded border border-surface-700 text-left text-indigo-300 transition-all"
            >
              <span className="font-semibold block">Demo Employee</span>
              <span className="text-[10px] text-surface-400">rahul@demo.com</span>
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-xs text-surface-400">
        Need an owner account?{' '}
        <Link href="/register" className="text-brand-400 font-semibold hover:underline">
          Create Organization
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/20">
            F
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            Field<span className="text-brand-400">Track</span>
          </span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-surface-100">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-surface-400">
          Field employee tracking & workforce management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="p-8 text-center text-surface-400 text-xs">Loading login form...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
