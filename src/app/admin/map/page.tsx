'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const DynamicLiveMap = dynamic(() => import('@/components/map/live-map'), { ssr: false });

export default function SuperAdminGlobalMapPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // 1. Fetch owners to build org filter
      const ownersRes = await fetch('/api/admin/owners?filter=ACTIVE');
      if (ownersRes.ok) {
        const ownersData = await ownersRes.json();
        setOwners(ownersData.owners || []);
      }

      // 2. Fetch all stats/employees
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const emps = statsData.liveEmployees || [];
        setEmployees(emps);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (selectedOrgId !== 'ALL' && emp.organizationId !== selectedOrgId) return false;
    if (statusFilter !== 'ALL' && emp.status !== statusFilter) return false;
    return true;
  });

  const mapMarkers = filteredEmployees
    .filter((e) => e.latitude && e.longitude)
    .map((e) => ({
      id: e.id,
      name: `${e.name} (${e.orgName})`,
      status: e.status,
      task: e.task,
      lat: e.latitude,
      lng: e.longitude,
      lastSeen: e.updatedAt ? new Date(e.updatedAt).toLocaleTimeString() : undefined,
    }));

  const workingCount = filteredEmployees.filter((e) => e.status === 'WORKING').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>🗺️ Global Platform Live Map</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          </h1>
          <p className="text-xs text-surface-400">
            Real-time GPS tracking monitor for all field workers across all client organizations
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold">
            🟢 {workingCount} Working Now
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-3 rounded-2xl border border-surface-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-purple-300">Filter Organization:</span>
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="px-3 py-1.5 bg-surface-900 border border-surface-700 rounded-lg text-white font-medium focus:outline-none"
          >
            <option value="ALL">All Organizations</option>
            {owners.map((o) => (
              <option key={o.id} value={o.ownedOrganization?.id}>
                {o.ownedOrganization?.name} ({o.name})
              </option>
            ))}
          </select>

          <span className="font-semibold text-purple-300 ml-2">Status:</span>
          <div className="flex gap-1">
            {['ALL', 'WORKING', 'OFFLINE'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
                  statusFilter === st
                    ? 'bg-purple-600 text-white'
                    : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={fetchData}
          className="px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-surface-200 rounded-lg text-xs font-semibold"
        >
          🔄 Refresh Map
        </button>
      </div>

      {/* Map & Side Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-2 rounded-2xl border border-surface-800 h-[520px] relative overflow-hidden shadow-2xl">
          {loading ? (
            <div className="flex items-center justify-center h-full text-surface-400 text-xs">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            </div>
          ) : mapMarkers.length > 0 ? (
            <DynamicLiveMap employees={mapMarkers} />
          ) : (
            <div className="flex items-center justify-center h-full text-surface-400 text-xs">
              No active employee GPS locations match the selected filter.
            </div>
          )}
        </div>

        {/* Side Panel Employee Cards */}
        <div className="glass-card p-4 rounded-2xl border border-surface-800 space-y-3 h-[520px] flex flex-col">
          <h3 className="text-sm font-bold text-white flex justify-between items-center border-b border-surface-800 pb-2">
            <span>Field Workforce ({filteredEmployees.length})</span>
            <span className="text-xs text-purple-300 font-mono">Real-time</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredEmployees.length === 0 ? (
              <p className="text-xs text-surface-400 py-4 text-center">No field employees found.</p>
            ) : (
              filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmpId(emp.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedEmpId === emp.id
                      ? 'bg-purple-950/80 border-purple-500/60 text-white shadow-lg'
                      : 'bg-surface-900/60 border-surface-800 text-surface-300 hover:bg-surface-800/60'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{emp.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        emp.status === 'WORKING'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-surface-800 text-surface-400 border border-surface-700'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-purple-300 mt-0.5">{emp.orgName}</p>

                  {emp.task && (
                    <p className="text-[11px] text-surface-400 truncate mt-1">📋 {emp.task}</p>
                  )}

                  {emp.latitude && emp.longitude && (
                    <div className="mt-2 text-[10px] font-mono text-emerald-400 flex justify-between items-center">
                      <span>📍 {emp.latitude.toFixed(4)}, {emp.longitude.toFixed(4)}</span>
                      <span className="text-surface-500">{emp.updatedAt ? new Date(emp.updatedAt).toLocaleTimeString() : ''}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
