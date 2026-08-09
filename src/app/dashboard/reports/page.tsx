'use client';

import React, { useState, useEffect } from 'react';

export default function ManagerReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/reports?export=true', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Workforce Productivity Reports</h1>
          <p className="text-xs text-surface-400">Exportable field employee performance analytics and task completion metrics</p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-lg flex items-center gap-1.5 transition-all"
        >
          📥 Export CSV Report
        </button>
      </div>

      {/* Reports Table */}
      <div className="glass-card rounded-2xl border border-surface-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-surface-400">Generating reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-xs text-surface-400">No report data available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-surface-300">
              <thead className="bg-surface-900/80 text-surface-400 uppercase tracking-wider text-[10px] font-semibold border-b border-surface-800">
                <tr>
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Total Working Time</th>
                  <th className="py-3 px-4">Tasks Assigned</th>
                  <th className="py-3 px-4">Tasks Completed</th>
                  <th className="py-3 px-4 text-right">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/60">
                {reports.map((r) => (
                  <tr key={r.employeeId} className="hover:bg-surface-800/30 transition-all">
                    <td className="py-3.5 px-4 font-bold text-white">{r.name}</td>
                    <td className="py-3.5 px-4 text-surface-400">{r.designation}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-300">{r.totalWorkingDuration}</td>
                    <td className="py-3.5 px-4 text-surface-300">{r.tasksAssigned}</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-bold">{r.tasksCompleted}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-white">{r.completionPercentage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
