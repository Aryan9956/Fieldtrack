'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EmployeesListPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, subRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/subscription'),
      ]);

      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data.employees || []);
      }
      if (subRes.ok) {
        const data = await subRes.json();
        setSubscription(data.subscription);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = employees.filter((e) => e.isActive).length;
  const limit = subscription?.employeeLimit || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Employee Directory</h1>
          <p className="text-xs text-surface-400">Manage field staff, view current statuses, and add new field representatives</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-xs bg-surface-900 px-3 py-1.5 rounded-lg border border-surface-800 text-surface-300">
            Active Limit: <strong className="text-emerald-400 font-mono">{activeCount} / {limit}</strong>
          </div>

          <Link
            href="/dashboard/employees/new"
            className={`px-4 py-2 text-white font-semibold text-xs rounded-lg shadow-lg flex items-center gap-1.5 transition-all ${
              activeCount >= limit
                ? 'bg-surface-700 cursor-not-allowed'
                : 'bg-brand-600 hover:bg-brand-500'
            }`}
          >
            + Add Employee
          </Link>
        </div>
      </div>

      {activeCount >= limit && (
        <div className="p-3 bg-amber-950/80 border border-amber-800 text-amber-300 text-xs rounded-xl flex justify-between items-center">
          <span>⚠️ You have reached your allocated employee limit ({activeCount} / {limit}). Contact administrator to increase employee limit.</span>
        </div>
      )}

      {/* Employees Table */}
      <div className="glass-card rounded-2xl border border-surface-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-surface-400">Loading employee list...</div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-xs text-surface-400">No employees added yet. Click "+ Add Employee" to create one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-surface-300">
              <thead className="bg-surface-900/80 text-surface-400 uppercase tracking-wider text-[10px] font-semibold border-b border-surface-800">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Current Task</th>
                  <th className="py-3 px-4">Last Seen</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/60">
                {employees.map((emp) => {
                  const currentTask = emp.tasks[0]?.title || '—';
                  const statusColor =
                    emp.currentStatus === 'WORKING'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : emp.currentStatus === 'ON_BREAK'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-surface-800 text-surface-400 border-surface-700';

                  return (
                    <tr key={emp.id} className="hover:bg-surface-800/30 transition-all">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{emp.user.name}</div>
                        <div className="text-surface-400 text-[11px]">{emp.user.email}</div>
                      </td>

                      <td className="py-3.5 px-4 text-surface-300">
                        {emp.designation || 'Field Representative'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${statusColor}`}>
                          {emp.currentStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-surface-300 font-medium">
                        {currentTask}
                      </td>

                      <td className="py-3.5 px-4 text-surface-400 text-[11px]">
                        {emp.lastSeenAt ? new Date(emp.lastSeenAt).toLocaleString('en-IN') : 'Never'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/dashboard/employees/${emp.id}`}
                          className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-lg shadow"
                        >
                          View Profile & Map →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
