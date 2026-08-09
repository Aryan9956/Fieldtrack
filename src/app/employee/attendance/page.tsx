'use client';

import React, { useState, useEffect } from 'react';
import { formatDuration } from '@/lib/utils';

export default function EmployeeAttendancePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/work/history');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Work History</h2>
        <p className="text-xs text-surface-400">Your logged work sessions and attendance records</p>
      </div>

      {loading ? (
        <div className="text-center text-xs text-surface-400 py-8">Loading attendance...</div>
      ) : sessions.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl border border-surface-800 text-center text-xs text-surface-400">
          No work sessions recorded yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {sessions.map((session) => (
            <div key={session.id} className="glass-card p-4 rounded-xl border border-surface-800 flex justify-between items-center text-xs">
              <div>
                <div className="font-bold text-white">
                  {new Date(session.startTime).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>
                <div className="text-surface-400 text-[11px] mt-0.5">
                  {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' — '}
                  {session.endTime
                    ? new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Active'}
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-brand-300 font-mono text-sm">
                  {formatDuration(session.duration)}
                </div>
                <span
                  className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded ${
                    session.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-surface-800 text-surface-400'
                  }`}
                >
                  {session.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
