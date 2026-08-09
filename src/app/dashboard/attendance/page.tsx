'use client';

import React, { useState, useEffect } from 'react';
import { formatDuration } from '@/lib/utils';

export default function ManagerAttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [range, setRange] = useState('TODAY');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, [range]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?range=${range}`);
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.attendance || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const ranges = [
    { label: 'Today', value: 'TODAY' },
    { label: 'Yesterday', value: 'YESTERDAY' },
    { label: 'This Week', value: 'THIS_WEEK' },
    { label: 'This Month', value: 'THIS_MONTH' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Attendance & Work Hours</h1>
          <p className="text-xs text-surface-400">Daily work session logs, shift start/end times, and cumulative working hours</p>
        </div>

        <div className="flex bg-surface-900 p-1 rounded-xl border border-surface-800">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === r.value
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="glass-card rounded-2xl border border-surface-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-surface-400">Loading attendance data...</div>
        ) : attendance.length === 0 ? (
          <div className="p-8 text-center text-xs text-surface-400">No attendance records for selected period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-surface-300">
              <thead className="bg-surface-900/80 text-surface-400 uppercase tracking-wider text-[10px] font-semibold border-b border-surface-800">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Work Start Time</th>
                  <th className="py-3 px-4">Work End Time</th>
                  <th className="py-3 px-4">Total Working Hours</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/60">
                {attendance.map((rec) => {
                  const statusColor =
                    rec.status === 'WORKING'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold'
                      : rec.status === 'ON_BREAK'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : rec.status === 'NOT_STARTED'
                      ? 'bg-surface-800 text-surface-500 border-surface-700'
                      : 'bg-surface-800 text-surface-300 border-surface-700';

                  return (
                    <tr key={rec.employeeId} className="hover:bg-surface-800/30 transition-all">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{rec.name}</div>
                        <div className="text-surface-400 text-[11px]">{rec.designation}</div>
                      </td>

                      <td className="py-3.5 px-4 text-surface-300">
                        {rec.startTime ? new Date(rec.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-surface-300">
                        {rec.endTime ? new Date(rec.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : rec.status === 'WORKING' ? 'In Progress' : '—'}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-brand-300 text-sm">
                        {formatDuration(rec.totalWorkingDurationSeconds)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold border ${statusColor}`}>
                          {rec.status}
                        </span>
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
