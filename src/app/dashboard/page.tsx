'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { formatDuration } from '@/lib/utils';

// Dynamically import LiveMap with SSR disabled (Leaflet requires window object)
const LiveMap = dynamic(() => import('@/components/map/live-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] bg-surface-900 rounded-2xl flex items-center justify-center text-xs text-surface-400">
      Loading OpenStreetMap Leaflet Engine...
    </div>
  ),
});

export default function DashboardPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Setup SSE connection for real-time live map updates
    const eventSource = new EventSource('/api/sse/dashboard');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMapMarkers(data);
      } catch (e) {}
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [empRes, taskRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/tasks'),
      ]);

      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data.employees || []);

        // Initial map markers
        const markers = (data.employees || []).map((emp: any) => {
          const ws = emp.workSessions[0];
          return {
            id: emp.id,
            name: emp.user.name,
            status: emp.currentStatus,
            task: emp.tasks[0]?.title || 'No active task',
            lat: ws?.startLat || 19.076,
            lng: ws?.startLng || 72.8777,
          };
        });
        setMapMarkers(markers);
      }

      if (taskRes.ok) {
        const data = await taskRes.json();
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const workingCount = employees.filter((e) => e.currentStatus === 'WORKING').length;
  const offlineCount = employees.filter((e) => e.currentStatus === 'OFFLINE').length;
  const onBreakCount = employees.filter((e) => e.currentStatus === 'ON_BREAK').length;
  const completedTasksCount = tasks.filter((t) => t.status === 'COMPLETED').length;

  const totalWorkingSeconds = employees.reduce((acc, emp) => {
    const empSeconds = emp.workSessions?.reduce((sAcc: number, s: any) => sAcc + (s.duration || 0), 0) || 0;
    return acc + empSeconds;
  }, 0);

  const topStats = [
    { title: 'Total Employees', value: employees.length, icon: '👥', color: 'border-blue-500/30 text-blue-400' },
    { title: 'Currently Working', value: workingCount, icon: '🟢', color: 'border-emerald-500/40 text-emerald-400 font-bold' },
    { title: 'Currently Offline', value: offlineCount, icon: '⚫', color: 'border-slate-700 text-slate-400' },
    { title: 'Tasks Today', value: tasks.length, icon: '📋', color: 'border-brand-500/30 text-brand-300' },
    { title: 'Completed Tasks', value: completedTasksCount, icon: '✅', color: 'border-emerald-500/30 text-emerald-300' },
    { title: 'Total Working Hours', value: formatDuration(totalWorkingSeconds), icon: '⏱️', color: 'border-indigo-500/30 text-indigo-300 font-mono' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Live Field Monitor</h1>
          <p className="text-xs text-surface-400">
            Real-time GPS tracking, active employee statuses, and daily task progress
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/employees/new"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow-lg flex items-center gap-1.5 transition-all"
          >
            <span>+ Add Employee</span>
          </Link>
        </div>
      </div>

      {/* Top Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {topStats.map((stat, i) => (
          <div key={i} className={`p-4 glass-card rounded-2xl border ${stat.color} space-y-2`}>
            <div className="flex justify-between items-center text-xs text-surface-400 font-medium">
              <span>{stat.title}</span>
              <span className="text-base">{stat.icon}</span>
            </div>
            <div className="text-xl font-extrabold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Live Map & Employee List Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Map Box (2 cols) */}
        <div className="lg:col-span-2 glass-card p-4 rounded-2xl border border-surface-800 space-y-3 shadow-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live GPS Field Map (Realtime Updates)
            </h3>
            <span className="text-[11px] text-surface-400">OpenStreetMap + Leaflet</span>
          </div>

          <div className="h-[420px] rounded-xl overflow-hidden border border-surface-800">
            <LiveMap employees={mapMarkers} />
          </div>
        </div>

        {/* Employee Status Table (1 col) */}
        <div className="glass-card p-4 rounded-2xl border border-surface-800 space-y-3 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-white">Active Workforce ({employees.length})</h3>
              <Link href="/dashboard/employees" className="text-xs text-brand-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2 max-h-[370px] overflow-y-auto pr-1">
              {employees.map((emp) => {
                const currentTask = emp.tasks[0]?.title || 'No active task';
                const statusColor =
                  emp.currentStatus === 'WORKING'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : emp.currentStatus === 'ON_BREAK'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-surface-800 text-surface-400 border-surface-700';

                return (
                  <Link
                    key={emp.id}
                    href={`/dashboard/employees/${emp.id}`}
                    className="p-3 bg-surface-900/60 hover:bg-surface-800/80 rounded-xl border border-surface-800 block transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-white text-xs group-hover:text-brand-300">
                        {emp.user.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                        {emp.currentStatus}
                      </span>
                    </div>

                    <p className="text-[11px] text-surface-400 truncate mt-1">
                      Task: {currentTask}
                    </p>

                    <div className="flex justify-between items-center mt-2 text-[10px] text-surface-500">
                      <span>{emp.designation || 'Field Rep'}</span>
                      <span>
                        Last Seen:{' '}
                        {emp.lastSeenAt ? new Date(emp.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
