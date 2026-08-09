'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddEmployeePage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('emp123');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('Field Technician');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, designation }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add employee');
        return;
      }

      router.push('/dashboard/employees');
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <Link href="/dashboard/employees" className="text-xs text-brand-400 hover:underline">
          ← Back to Employees List
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Add New Field Employee</h1>
        <p className="text-xs text-surface-400">Create employee credentials for the mobile tracking app</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-surface-800 shadow-xl">
        {error && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-300 uppercase tracking-wider mb-1">
              Employee Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rahul Verma"
              className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-300 uppercase tracking-wider mb-1">
              Email Address (Login ID)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@company.com"
              className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-300 uppercase tracking-wider mb-1">
              Initial Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-300 uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-300 uppercase tracking-wider mb-1">
              Designation / Role Title
            </label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Senior Field Inspector"
              className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-lg shadow-lg"
          >
            {loading ? 'Creating Account...' : 'Create Employee Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
