'use client';

import React, { useState, useEffect, useRef } from 'react';
import { locationService, LocationData, OfflineLocationQueue } from '@/lib/location-service';
import { formatDuration } from '@/lib/utils';

export default function EmployeeHomePage() {
  const [user, setUser] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);

  const [isWorking, setIsWorking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [trackingActive, setTrackingActive] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Timer interval for working session
  useEffect(() => {
    if (isWorking && activeSession?.startTime) {
      const start = new Date(activeSession.startTime).getTime();
      const updateTimer = () => {
        const seconds = Math.floor((Date.now() - start) / 1000);
        setElapsedSeconds(seconds > 0 ? seconds : 0);
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWorking, activeSession]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        const emp = data.user.employeeProfile;
        setEmployee(emp);

        // Fetch tasks
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setAssignedTasks(data.tasks || []);
      }
    } catch (e) {}
  };

  const handleStartWork = async () => {
    setError('');
    setLocationStatus('Requesting GPS location permission...');

    try {
      // 1. Get GPS coordinates (via Capacitor Native or Web Geolocation API)
      const coords = await locationService.getCurrentPosition();
      setLastCoords({ lat: coords.latitude, lng: coords.longitude });

      // 2. Call API to start work session
      const res = await fetch('/api/work/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to start work session');
        setLocationStatus('');
        return;
      }

      setIsWorking(true);
      setActiveSession(data.workSession);
      setTrackingActive(true);
      setLocationStatus('🟢 GPS Tracking Active');

      // 3. Begin background location updates
      locationService.startTracking(
        (loc) => {
          setLastCoords({ lat: loc.latitude, lng: loc.longitude });
          sendLocationUpdate(loc);
        },
        (err) => {
          setLocationStatus(`⚠️ ${err}`);
        }
      );
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'GPS permission denied or location unavailable.');
      setLocationStatus('');
    }
  };

  const handleStopWork = async () => {
    if (!confirm('Are you sure you want to stop working? GPS tracking will be deactivated.')) return;

    setError('');
    try {
      let coords = lastCoords;
      try {
        const currentPos = await locationService.getCurrentPosition();
        coords = { lat: currentPos.latitude, lng: currentPos.longitude };
      } catch (e) {}

      const res = await fetch('/api/work/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords?.lat,
          longitude: coords?.lng,
        }),
      });

      if (res.ok) {
        locationService.stopTracking();
        setIsWorking(false);
        setActiveSession(null);
        setTrackingActive(false);
        setLocationStatus('Stopped');
      }
    } catch (e) {
      setError('Failed to stop work session');
    }
  };

  const sendLocationUpdate = async (loc: LocationData) => {
    try {
      const res = await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
        }),
      });

      if (!res.ok) {
        OfflineLocationQueue.enqueue(loc);
      }
    } catch (e) {
      // Internet / network failed while employee is in the field
      OfflineLocationQueue.enqueue(loc);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeTask = assignedTasks.find(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'ACCEPTED'
  ) || assignedTasks[0];

  return (
    <div className="space-y-5">
      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Team Member'} 👋
          </h2>
          <p className="text-xs text-surface-400">
            {employee?.designation || 'Field Representative'}
          </p>
        </div>

        <div className="text-right">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              isWorking
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                : 'bg-surface-800 text-surface-400 border border-surface-700'
            }`}
          >
            {isWorking ? '🟢 Working' : '⚫ Offline'}
          </span>
        </div>
      </div>

      {/* Error & GPS Permission Guidance Box */}
      {error && (
        <div className="p-4 bg-red-950/90 border border-red-800 text-red-300 text-xs rounded-xl space-y-2 shadow-lg">
          <div className="flex items-center space-x-2 font-bold text-red-200">
            <span>📍 Location Access Required</span>
          </div>
          <p className="text-red-300 leading-relaxed">{error}</p>

          <div className="pt-2 border-t border-red-900/60 text-[11px] text-red-200 space-y-1">
            <p className="font-semibold">How to enable location access:</p>
            <ol className="list-decimal pl-4 space-y-0.5 text-red-300">
              <li><strong>On Android Phone App (.apk)</strong>: Go to Phone <em>Settings → Apps → FieldTrack → Permissions → Location → Allow while using app</em>.</li>
              <li><strong>On Chrome / Mobile Browser</strong>: Tap the Lock icon (🔒) or Tune icon (🎛️) next to the URL → Tap <em>Permissions → Location → Allow</em>.</li>
            </ol>
          </div>

          <button
            type="button"
            onClick={handleStartWork}
            className="w-full mt-2 py-2 px-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition-all shadow"
          >
            🔄 Grant Permission & Retry START WORK
          </button>
        </div>
      )}

      {/* GPS Active Indicator Banner */}
      {trackingActive && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-semibold">GPS Location Tracking Active</span>
          </div>
          {lastCoords && (
            <span className="text-[10px] font-mono text-emerald-400">
              {lastCoords.lat.toFixed(4)}, {lastCoords.lng.toFixed(4)}
            </span>
          )}
        </div>
      )}

      {/* Timer & Work Session Controls Card */}
      <div className="glass-card p-6 rounded-2xl border border-surface-800 text-center space-y-4 shadow-xl">
        <div>
          <span className="text-xs text-surface-400 uppercase tracking-wider font-semibold">
            Today's Working Duration
          </span>
          <div className="text-4xl font-extrabold text-white tracking-tight mt-1 font-mono">
            {formatDuration(elapsedSeconds)}
          </div>
        </div>

        {locationStatus && (
          <p className="text-xs text-brand-300 font-medium">{locationStatus}</p>
        )}

        <div className="pt-2">
          {!isWorking ? (
            <button
              onClick={handleStartWork}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base rounded-xl shadow-xl shadow-emerald-600/30 active:scale-[0.98] transition-all"
            >
              🚀 START WORK
            </button>
          ) : (
            <button
              onClick={handleStopWork}
              className="w-full py-4 px-6 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-base rounded-xl shadow-xl shadow-rose-600/30 active:scale-[0.98] transition-all"
            >
              ⏹️ STOP WORK
            </button>
          )}
        </div>
      </div>

      {/* Current Assigned Task Card */}
      <div className="glass-card p-5 rounded-2xl border border-surface-800 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-surface-400 uppercase tracking-wider">
            Current Task
          </span>
          {activeTask && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded">
              {activeTask.priority}
            </span>
          )}
        </div>

        {activeTask ? (
          <div className="space-y-2">
            <h3 className="font-bold text-white text-base">{activeTask.title}</h3>
            {activeTask.description && (
              <p className="text-xs text-surface-300">{activeTask.description}</p>
            )}
            {activeTask.location && (
              <p className="text-xs text-surface-400 flex items-center gap-1">
                📍 <span>{activeTask.location}</span>
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-surface-400">No active tasks assigned currently.</p>
        )}
      </div>

      {/* Privacy Notice Card */}
      <div className="p-4 bg-surface-900/60 rounded-xl border border-surface-800 text-[11px] text-surface-400 space-y-1">
        <div className="flex items-center space-x-1 text-surface-300 font-semibold">
          <span>🔒 Privacy Notice:</span>
        </div>
        <p>
          GPS location is recorded exclusively during active work sessions. Tracking stops immediately when you click <strong>STOP WORK</strong>.
        </p>
      </div>
    </div>
  );
}
