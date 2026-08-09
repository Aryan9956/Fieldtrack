'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      setStats(data.stats);
    } catch (e: any) {
      setError(e.message);
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

  if (error) {
    return (
      <div className="p-4 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-sm">
        {error}
      </div>
    );
  }

  const statCards = [
    { title: 'Total Owners', value: stats.totalOwners, icon: '🏢', color: 'border-blue-500/30 bg-blue-950/10 text-blue-400' },
    { title: 'Verified Owners', value: stats.verifiedOwners, icon: '✅', color: 'border-emerald-500/30 bg-emerald-950/10 text-emerald-400' },
    { title: 'Pending Approval', value: stats.pendingOwners, icon: '⏳', color: 'border-amber-500/30 bg-amber-950/10 text-amber-400', badge: stats.pendingOwners > 0 ? 'Action Needed' : null },
    { title: 'Active Owners', value: stats.activeOwners, icon: '🟢', color: 'border-emerald-500/30 bg-emerald-950/10 text-emerald-300' },
    { title: 'Suspended Owners', value: stats.suspendedOwners, icon: '⚠️', color: 'border-orange-500/30 bg-orange-950/10 text-orange-400' },
    { title: 'Revoked Accounts', value: stats.revokedOwners, icon: '🚫', color: 'border-rose-500/30 bg-rose-950/10 text-rose-400' },
    { title: 'Expired Accounts', value: stats.expiredOwners, icon: '⌛', color: 'border-purple-500/30 bg-purple-950/10 text-purple-400' },
    { title: 'Total Employees', value: stats.totalEmployees, icon: '👥', color: 'border-indigo-500/30 bg-indigo-950/10 text-indigo-400' },
    { title: 'Active Employees', value: stats.activeEmployees, icon: '📱', color: 'border-cyan-500/30 bg-cyan-950/10 text-cyan-400' },
    { title: 'Currently Working', value: stats.currentlyWorking, icon: '🛰️', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300 font-bold' },
    { title: 'Total Tasks', value: `${stats.completedTasks} / ${stats.totalTasks}`, subtitle: 'Completed Tasks', icon: '📋', color: 'border-violet-500/30 bg-violet-950/10 text-violet-400' },
    { title: 'Revenue Collected', value: stats.revenue, subtitle: 'Payment Inactive (₹0 MVP)', icon: '💰', color: 'border-slate-700 bg-slate-900/60 text-slate-400' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Overview</h1>
          <p className="text-xs text-surface-400">
            Real-time platform metrics, owner approvals, and employee statistics
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/owners?filter=PENDING"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-lg flex items-center gap-1.5 transition-all"
          >
            <span>⏳ Review Pending Owners ({stats.pendingOwners})</span>
          </Link>
          <Link
            href="/admin/owners"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-lg flex items-center gap-1.5 transition-all"
          >
            <span>🏢 All Owners</span>
          </Link>
        </div>
      </div>

      {/* 12 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl glass-card border ${card.color} transition-all hover:scale-[1.02] flex flex-col justify-between`}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-surface-300 uppercase tracking-wider">{card.title}</span>
              <span className="text-xl">{card.icon}</span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-extrabold text-white tracking-tight">{card.value}</div>
              {card.subtitle && <p className="text-[11px] text-surface-400 mt-1">{card.subtitle}</p>}
              {card.badge && (
                <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                  {card.badge}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Commercial Architecture Status Notice */}
      <div className="p-6 glass-card rounded-2xl border border-purple-900/40 bg-purple-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
            <h3 className="text-sm font-bold text-purple-200">Commercial Architecture Status</h3>
          </div>
          <p className="text-xs text-surface-300 max-w-2xl">
            Commercial pricing is configured at <strong className="text-amber-300">₹19 per active employee / month</strong>. Payment gateway processing is set to <strong className="text-slate-300 font-mono">PAYMENTS_ENABLED=false</strong> so the system operates at ₹0 development & test cost. Access is granted manually by Super Admin.
          </p>
        </div>
        <Link
          href="/admin/owners"
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap"
        >
          Manage Owner Access Limits →
        </Link>
      </div>
    </div>
  );
}
