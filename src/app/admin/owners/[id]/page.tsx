'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminOwnerDetailPage({ params }: { params: { id: string } }) {
  const [owner, setOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnerDetail();
  }, [params.id]);

  const fetchOwnerDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/owners/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOwner(data.owner);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!owner) {
    return <div className="text-surface-400 text-xs py-8">Owner account not found.</div>;
  }

  const org = owner.ownedOrganization;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/owners" className="text-xs text-purple-400 hover:underline">
          ← Back to Owners List
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{owner.name}</h1>
            <p className="text-xs text-surface-400">
              {owner.email} • Organization: <strong className="text-purple-300">{org?.name}</strong>
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold w-fit border ${
              org?.accessStatus === 'ACTIVE'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            Access Status: {org?.accessStatus || 'PENDING'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-surface-800 space-y-1">
          <span className="text-[10px] text-surface-400 uppercase font-semibold">Email Status</span>
          <div className="text-sm font-bold text-white">
            {owner.emailVerified ? '✅ Verified' : '⏳ Unverified'}
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-surface-800 space-y-1">
          <span className="text-[10px] text-surface-400 uppercase font-semibold">Employee Allocation</span>
          <div className="text-sm font-bold text-white">
            {org?.employees?.length || 0} / {org?.employeeLimit || 0} Active Max
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-surface-800 space-y-1">
          <span className="text-[10px] text-surface-400 uppercase font-semibold">Commercial Price</span>
          <div className="text-sm font-bold text-emerald-400">
            ₹19 / employee / mo
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-surface-800 space-y-1">
          <span className="text-[10px] text-surface-400 uppercase font-semibold">Calculated Bill</span>
          <div className="text-sm font-bold text-emerald-300 font-mono">
            ₹{(org?.employees?.length || 0) * 19} / mo
          </div>
        </div>
      </div>

      {/* Employees list under org */}
      <div className="glass-card p-5 rounded-2xl border border-surface-800 space-y-3">
        <h3 className="text-sm font-bold text-white">Employees under Organization ({org?.employees?.length || 0})</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {org?.employees?.length === 0 ? (
            <p className="text-xs text-surface-400">No employees added yet.</p>
          ) : (
            org?.employees?.map((emp: any) => (
              <div key={emp.id} className="p-3 bg-surface-900/60 rounded-xl border border-surface-800 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-white">{emp.user.name}</span>
                  <span className="text-surface-400 ml-2">({emp.user.email})</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-surface-800 text-surface-300 border border-surface-700">
                  {emp.currentStatus}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
