'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { formatDuration } from '@/lib/utils';

// Dynamically import LocationHistoryMap
const LocationHistoryMap = dynamic(() => import('@/components/map/location-history-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] bg-surface-900 rounded-xl flex items-center justify-center text-xs text-surface-400">
      Loading Route Path Map...
    </div>
  ),
});

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const [employee, setEmployee] = useState<any>(null);
  const [locationHistory, setLocationHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // Share Live Location state
  const [shareUrl, setShareUrl] = useState('');
  const [generatingShare, setGeneratingShare] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchEmployeeDetail();
  }, [params.id]);

  useEffect(() => {
    fetchLocationHistory(selectedDate);
  }, [selectedDate, params.id]);

  const fetchEmployeeDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setEmployee(data.employee);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationHistory = async (dateStr: string) => {
    try {
      const res = await fetch(`/api/employees/${params.id}/location-history?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setLocationHistory(data.locations || []);
      }
    } catch (e) {}
  };

  const handleGenerateShareLink = async () => {
    setGeneratingShare(true);
    try {
      const res = await fetch('/api/share-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: params.id,
          durationHours: 24,
          title: `Live Tracking — ${employee?.user?.name}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShareUrl(data.shareUrl);
        setShowShareModal(true);
      } else {
        alert(data.error || 'Failed to generate live tracking link');
      }
    } catch (e) {
      alert('Failed to generate link');
    } finally {
      setGeneratingShare(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!employee) {
    return <div className="text-surface-400 text-xs py-8">Employee not found.</div>;
  }

  const user = employee.user;
  const sessions = employee.workSessions || [];
  const tasks = employee.tasks || [];
  const totalSeconds = sessions.reduce((acc: number, s: any) => acc + (s.duration || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/employees" className="text-xs text-brand-400 hover:underline">
          ← Back to Employees
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xl shadow-lg">
              {user.name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{user.name}</h1>
              <p className="text-xs text-surface-400">
                {employee.designation || 'Field Representative'} • {user.email} • {employee.phone || 'No phone'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleGenerateShareLink}
              disabled={generatingShare}
              className="px-3.5 py-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center gap-1.5 transition-all"
            >
              <span>🔗</span>
              <span>{generatingShare ? 'Generating...' : 'Share Live Location Link'}</span>
            </button>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                employee.currentStatus === 'WORKING'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                  : 'bg-surface-800 text-surface-400 border border-surface-700'
              }`}
            >
              {employee.currentStatus === 'WORKING' ? '🟢 Currently Working' : '⚫ Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-surface-800 space-y-1">
          <span className="text-[10px] text-surface-400 uppercase font-semibold">Total Logged Time</span>
          <div className="text-xl font-extrabold text-brand-300 font-mono">{formatDuration(totalSeconds)}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-surface-800 space-y-1">
          <span className="text-[10px] text-surface-400 uppercase font-semibold">Assigned Tasks</span>
          <div className="text-xl font-extrabold text-white">{tasks.length} Tasks</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-surface-800 space-y-1">
          <span className="text-[10px] text-surface-400 uppercase font-semibold">Work Sessions</span>
          <div className="text-xl font-extrabold text-emerald-400">{sessions.length} Sessions</div>
        </div>
      </div>

      {/* Location History Map Section */}
      <div className="glass-card p-5 rounded-2xl border border-surface-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Location History & Route Path</h3>
            <p className="text-xs text-surface-400">GPS breadcrumb trail and movement polyline visualization</p>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs text-surface-300 font-medium">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-surface-900 border border-surface-700 rounded-lg text-xs text-white"
            />
          </div>
        </div>

        <LocationHistoryMap locations={locationHistory} />

        <div className="text-[11px] text-surface-400">
          Showing <strong>{locationHistory.length} GPS points</strong> recorded for {selectedDate}.
        </div>
      </div>

      {/* Tasks & Work Sessions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Tasks */}
        <div className="glass-card p-5 rounded-2xl border border-surface-800 space-y-3">
          <h3 className="text-sm font-bold text-white">Assigned Tasks ({tasks.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="text-xs text-surface-400">No tasks assigned to this employee.</p>
            ) : (
              tasks.map((task: any) => (
                <div key={task.id} className="p-3 bg-surface-900/60 rounded-xl border border-surface-800 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">{task.title}</div>
                    <div className="text-[11px] text-surface-400">{task.location || 'No address specified'}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-800 text-surface-300 border border-surface-700">
                    {task.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Work Sessions */}
        <div className="glass-card p-5 rounded-2xl border border-surface-800 space-y-3">
          <h3 className="text-sm font-bold text-white">Recent Work Sessions ({sessions.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sessions.length === 0 ? (
              <p className="text-xs text-surface-400">No work sessions logged.</p>
            ) : (
              sessions.map((s: any) => (
                <div key={s.id} className="p-3 bg-surface-900/60 rounded-xl border border-surface-800 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">
                      {new Date(s.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="text-[11px] text-surface-400">
                      {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-brand-300">{formatDuration(s.duration)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl border border-brand-500/40 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-surface-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>🔗 Live Location Share Link</span>
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-surface-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-surface-300">
              Share this live tracking link with clients, supervisors, or team members. Anyone with this link can view {user.name}'s real-time GPS location on an interactive map without logging in.
            </p>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-brand-300 font-bold mb-1">
                Public Live Tracking URL
              </label>
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-lg text-xs font-mono text-white selection:bg-brand-600"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] text-surface-400">Valid for 24 Hours • 5s Auto-refresh</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  alert('Live tracking link copied to clipboard!');
                }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold shadow transition-all"
              >
                📋 Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
