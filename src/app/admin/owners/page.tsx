'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AdminOwnersContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'ALL';

  const [owners, setOwners] = useState<any[]>([]);
  const [filter, setFilter] = useState(initialFilter);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [durationDays, setDurationDays] = useState(30);
  const [employeeLimit, setEmployeeLimit] = useState(10);
  const [grantReason, setGrantReason] = useState('Standard initial allocation');
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    fetchOwners();
  }, [filter, search]);

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/owners?filter=${filter}&q=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setOwners(data.owners || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwner) return;
    setGranting(true);

    try {
      const res = await fetch(`/api/admin/owners/${selectedOwner.id}/grant-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationDays,
          employeeLimit,
          reason: grantReason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to grant access');
        return;
      }

      alert(`Access successfully granted to ${selectedOwner.name} for ${durationDays} days (${employeeLimit} employee limit)!`);
      setSelectedOwner(null);
      fetchOwners();
    } catch (err) {
      alert('Error granting access');
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (owner: any) => {
    if (!confirm(`Are you sure you want to REVOKE access for ${owner.name}?`)) return;
    try {
      const res = await fetch(`/api/admin/owners/${owner.id}/revoke-access`, { method: 'POST' });
      if (res.ok) fetchOwners();
    } catch (e) {
      alert('Failed to revoke access');
    }
  };

  const handleSuspend = async (owner: any) => {
    if (!confirm(`Are you sure you want to SUSPEND access for ${owner.name}?`)) return;
    try {
      const res = await fetch(`/api/admin/owners/${owner.id}/suspend`, { method: 'POST' });
      if (res.ok) fetchOwners();
    } catch (e) {
      alert('Failed to suspend access');
    }
  };

  const handleReactivate = async (owner: any) => {
    try {
      const res = await fetch(`/api/admin/owners/${owner.id}/reactivate`, { method: 'POST' });
      if (res.ok) fetchOwners();
    } catch (e) {
      alert('Failed to reactivate access');
    }
  };

  const filterTabs = ['ALL', 'PENDING', 'VERIFIED', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Owner Management</h1>
          <p className="text-xs text-surface-400">
            Review registered business owners, verify email statuses, and manage access approvals & limits
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-3 rounded-2xl border border-surface-800">
        <div className="flex flex-wrap gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === tab
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search owner name, email, or org..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-1.5 bg-surface-900 border border-surface-700 rounded-lg text-xs text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="glass-card rounded-2xl border border-surface-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-surface-400 text-xs">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading owner accounts...
          </div>
        ) : owners.length === 0 ? (
          <div className="p-12 text-center text-surface-400 text-xs">
            No owner accounts found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-surface-300">
              <thead className="bg-surface-900/80 text-surface-400 uppercase tracking-wider text-[10px] font-semibold border-b border-surface-800">
                <tr>
                  <th className="py-3 px-4">Owner & Organization</th>
                  <th className="py-3 px-4">Email Status</th>
                  <th className="py-3 px-4">Access Status</th>
                  <th className="py-3 px-4">Employees</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/60">
                {owners.map((owner) => {
                  const org = owner.ownedOrganization;
                  const empCount = org?._count?.employees || 0;
                  const empLimit = org?.employeeLimit || 0;
                  const accessStatus = org?.accessStatus || 'PENDING';

                  return (
                    <tr key={owner.id} className="hover:bg-surface-800/30 transition-all">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{owner.name}</div>
                        <div className="text-surface-400 text-[11px]">{owner.email}</div>
                        {org && <div className="text-purple-300 font-medium text-[11px] mt-0.5">{org.name}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        {owner.emailVerified ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⏳ Unverified
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${
                            accessStatus === 'ACTIVE'
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                              : accessStatus === 'PENDING'
                              ? 'bg-amber-950/60 text-amber-400 border-amber-500/40 animate-pulse'
                              : accessStatus === 'SUSPENDED'
                              ? 'bg-orange-950/60 text-orange-400 border-orange-500/40'
                              : accessStatus === 'REVOKED'
                              ? 'bg-rose-950/60 text-rose-400 border-rose-500/40'
                              : 'bg-purple-950/60 text-purple-400 border-purple-500/40'
                          }`}
                        >
                          {accessStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-surface-200">
                        {empCount} / {empLimit}
                      </td>

                      <td className="py-3.5 px-4 text-surface-400 text-[11px]">
                        {org?.accessExpiresAt
                          ? new Date(org.accessExpiresAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Not set'}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedOwner(owner)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-semibold text-[11px] shadow"
                        >
                          Grant / Edit Access
                        </button>

                        {accessStatus === 'ACTIVE' && (
                          <button
                            onClick={() => handleSuspend(owner)}
                            className="px-2 py-1 bg-orange-950/80 hover:bg-orange-900 text-orange-300 rounded text-[11px] border border-orange-800"
                          >
                            Suspend
                          </button>
                        )}

                        {accessStatus === 'ACTIVE' && (
                          <button
                            onClick={() => handleRevoke(owner)}
                            className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded text-[11px] border border-rose-800"
                          >
                            Revoke
                          </button>
                        )}

                        {(accessStatus === 'SUSPENDED' || accessStatus === 'REVOKED' || accessStatus === 'EXPIRED') && (
                          <button
                            onClick={() => handleReactivate(owner)}
                            className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded text-[11px] border border-emerald-800"
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOwner && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl border border-purple-900/50 space-y-4">
            <div className="flex justify-between items-center border-b border-surface-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Grant Access — {selectedOwner.name}
              </h3>
              <button
                onClick={() => setSelectedOwner(null)}
                className="text-surface-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGrantAccess} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
                  Access Duration (Days)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[7, 30, 90, 365].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDurationDays(days)}
                      className={`py-1.5 text-xs font-bold rounded border ${
                        durationDays === days
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-surface-900 text-surface-300 border-surface-700'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  required
                  min={1}
                  max={1000}
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
                  Maximum Active Employee Limit
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[5, 10, 25, 50].map((limit) => (
                    <button
                      key={limit}
                      type="button"
                      onClick={() => setEmployeeLimit(limit)}
                      className={`py-1.5 text-xs font-bold rounded border ${
                        employeeLimit === limit
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-surface-900 text-surface-300 border-surface-700'
                      }`}
                    >
                      {limit} Emp
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  required
                  min={1}
                  max={500}
                  value={employeeLimit}
                  onChange={(e) => setEmployeeLimit(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded text-xs text-white placeholder-surface-500"
                  placeholder="e.g. Approved initial subscription tier"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOwner(null)}
                  className="px-4 py-2 bg-surface-800 text-surface-300 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={granting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold shadow"
                >
                  {granting ? 'Granting...' : 'Grant Access Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOwnersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-surface-400">Loading owners management...</div>}>
      <AdminOwnersContent />
    </Suspense>
  );
}
