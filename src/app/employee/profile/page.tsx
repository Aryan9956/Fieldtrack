'use client';

import React, { useState, useEffect } from 'react';

export default function EmployeeProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-xs text-surface-400">Loading profile...</div>;

  const emp = user?.employeeProfile;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Employee Profile</h2>
        <p className="text-xs text-surface-400">Your account and organization details</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-surface-800 space-y-4 text-xs">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center font-bold text-white text-lg">
            {user?.name?.[0] || 'E'}
          </div>
          <div>
            <h3 className="font-bold text-white text-base">{user?.name}</h3>
            <p className="text-surface-400">{emp?.designation || 'Field Representative'}</p>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-surface-800">
          <div>
            <span className="text-surface-500 block text-[10px] uppercase font-semibold">Email Address</span>
            <span className="text-surface-200 font-medium">{user?.email}</span>
          </div>

          <div>
            <span className="text-surface-500 block text-[10px] uppercase font-semibold">Phone Number</span>
            <span className="text-surface-200 font-medium">{emp?.phone || 'Not set'}</span>
          </div>

          <div>
            <span className="text-surface-500 block text-[10px] uppercase font-semibold">Organization Workspace</span>
            <span className="text-brand-300 font-bold">{emp?.organization?.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
