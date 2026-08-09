'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const DynamicLiveMap = dynamic(() => import('@/components/map/live-map'), { ssr: false });

export default function PublicShareLocationPage({ params }: { params: { shareToken: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());

  useEffect(() => {
    fetchShareData();
    const interval = setInterval(fetchShareData, 5000); // 5s live auto-refresh
    return () => clearInterval(interval);
  }, [params.shareToken]);

  const fetchShareData = async () => {
    try {
      const res = await fetch(`/api/share-location/${params.shareToken}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to load live tracking view');
        return;
      }

      setData(json);
      setError('');
      setLastFetchTime(new Date());
    } catch (e) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col justify-center items-center p-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-surface-300 font-semibold">Loading live location tracking view...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col justify-center items-center p-4 text-center">
        <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center text-2xl border border-red-500/30 mb-4">
          📍
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Live Tracking Unavailable</h2>
        <p className="text-sm text-red-300 max-w-sm">{error}</p>
      </div>
    );
  }

  const mapEmployees = (data?.employees || [])
    .filter((e: any) => e.latitude && e.longitude)
    .map((e: any) => ({
      id: e.id,
      name: e.name,
      status: e.status,
      task: e.task,
      lat: e.latitude,
      lng: e.longitude,
      lastSeen: e.updatedAt ? new Date(e.updatedAt).toLocaleTimeString() : undefined,
    }));

  const activeWorker = data?.employees?.[0];

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col text-white">
      {/* Public Header */}
      <header className="bg-surface-900/90 backdrop-blur-md border-b border-surface-800 px-4 py-3 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white font-bold text-sm shadow">
            F
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">
              {data?.organizationName || 'FieldTrack'}
            </h1>
            <p className="text-[11px] text-brand-300 font-medium mt-0.5">
              Live Location Sharing
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-[11px] text-emerald-400 font-semibold hidden sm:inline">
            Live Stream (5s)
          </span>
        </div>
      </header>

      {/* Main Map View */}
      <main className="flex-1 relative min-h-[calc(100vh-60px)]">
        {mapEmployees.length > 0 ? (
          <DynamicLiveMap employees={mapEmployees} zoom={14} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-900/50 p-6 text-center">
            <p className="text-sm text-surface-300 font-semibold mb-1">Worker Position Not Broadcast Yet</p>
            <p className="text-xs text-surface-500 max-w-xs">
              GPS location updates will appear automatically as soon as the worker starts their shift.
            </p>
          </div>
        )}

        {/* Floating Info Overlay Card */}
        {activeWorker && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:w-80 z-20 glass-card p-4 rounded-2xl border border-surface-700/60 shadow-2xl space-y-2">
            <div className="flex justify-between items-center border-b border-surface-800 pb-2">
              <span className="text-xs font-bold text-white">{activeWorker.name}</span>
              <span
                className={`px-2 py-0.5 text-[10px] font-extrabold rounded ${
                  activeWorker.status === 'WORKING'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-surface-800 text-surface-400 border border-surface-700'
                }`}
              >
                {activeWorker.status}
              </span>
            </div>

            {activeWorker.task && (
              <p className="text-xs text-surface-300 flex items-center gap-1">
                📋 <span className="font-semibold text-white">{activeWorker.task}</span>
              </p>
            )}

            {activeWorker.latitude && activeWorker.longitude && (
              <div className="text-[11px] font-mono text-surface-400 flex justify-between">
                <span>Coordinates:</span>
                <span className="text-brand-300 font-semibold">
                  {activeWorker.latitude.toFixed(4)}, {activeWorker.longitude.toFixed(4)}
                </span>
              </div>
            )}

            <div className="pt-1 text-[10px] text-surface-500 flex justify-between">
              <span>Auto-refresh active</span>
              <span>Updated {lastFetchTime.toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
