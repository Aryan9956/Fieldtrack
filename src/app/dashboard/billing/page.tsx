'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default function OwnerBillingPage() {
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/subscription')
      .then((res) => res.json())
      .then((data) => {
        if (data.subscription) setSub(data.subscription);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeEmpCount = sub?.activeEmployeeCount || 0;
  const estimatedCost = sub?.estimatedMonthlyCost || activeEmpCount * 19;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Subscription & Billing</h1>
          <p className="text-xs text-surface-400">View pricing breakdown based on active field employees</p>
        </div>

        <Link
          href="/dashboard/employees/new"
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-lg shadow-lg flex items-center gap-1.5 transition-all w-fit"
        >
          + Add Employee
        </Link>
      </div>

      {/* Subscription Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-surface-800 space-y-2">
          <span className="text-[10px] text-surface-400 uppercase font-semibold">Current Plan</span>
          <div className="text-xl font-extrabold text-white">FieldTrack SaaS</div>
          <div className="text-xs text-brand-300 font-semibold">₹19 / employee / month</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-surface-800 space-y-2">
          <span className="text-[10px] text-surface-400 uppercase font-semibold">Active Field Staff</span>
          <div className="text-xl font-extrabold text-white font-mono">{activeEmpCount} Employees</div>
          <div className="text-xs text-surface-400">Limit: {sub?.employeeLimit} max</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 space-y-2">
          <span className="text-[10px] text-emerald-400 uppercase font-semibold">Calculated Monthly Cost</span>
          <div className="text-2xl font-extrabold text-emerald-300 font-mono">{formatCurrency(estimatedCost)}</div>
          <div className="text-[11px] text-surface-400 font-mono">₹19 × {activeEmpCount} active employees</div>
        </div>
      </div>

      {/* Payment Gateway Inactive Status Box */}
      <div className="glass-card p-6 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-4 shadow-xl">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xl border border-amber-500/30 shrink-0">
            💳
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Online Payment System Status</h3>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Online payment gateway processing is currently <strong className="text-amber-300">disabled</strong> for testing. No credit card, UPI, or Razorpay credentials are required. Your workspace access is granted directly by the platform administrator.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-amber-900/40">
          <span className="text-xs text-surface-400">Status: Access Granted Manually (Free MVP Mode)</span>

          <button
            disabled
            className="w-full sm:w-auto px-6 py-2.5 bg-surface-800 text-surface-500 font-bold text-xs rounded-xl border border-surface-700 cursor-not-allowed"
          >
            Payment Coming Soon
          </button>
        </div>
      </div>

      {/* Pricing Rule Reference */}
      <div className="glass-card p-5 rounded-2xl border border-surface-800 space-y-3 text-xs text-surface-300">
        <h4 className="font-bold text-white">Commercial Pricing Rules:</h4>
        <ul className="space-y-1.5 text-surface-400 list-disc list-inside">
          <li>Price per active employee is fixed at ₹19/month.</li>
          <li>Billing is automatically calculated based on currently active employees.</li>
          <li>Deactivated or inactive employees do not count toward your monthly cost or employee limit.</li>
          <li>Adding or removing employees immediately updates your calculated bill.</li>
        </ul>
      </div>
    </div>
  );
}
