import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 selection:bg-brand-500 selection:text-white">
      {/* Navigation Bar */}
      <nav className="glass-panel sticky top-0 z-50 px-6 py-4 border-b border-surface-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-brand-500/20">
              F
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              Field<span className="text-brand-400">Track</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-semibold text-surface-300 hover:text-white transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-600/30 transition-all"
            >
              Start Tracking →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-bold">
            <span>✨ Transparent Pricing: ₹19 / employee / month</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Know Where Your Field Team Is. <br />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              Know What They're Doing.
            </span>
          </h1>

          <p className="text-lg text-surface-300 max-w-2xl mx-auto leading-relaxed">
            Simple employee tracking, live GPS location history, shift attendance, and task management built for field teams & business managers.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-extrabold text-base rounded-2xl shadow-2xl shadow-brand-600/30 transition-all"
            >
              Start Tracking (₹19/emp)
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-surface-900 hover:bg-surface-800 text-surface-200 font-bold text-base rounded-2xl border border-surface-700 transition-all"
            >
              Manager Login
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Banner */}
      <section className="py-12 px-6 bg-surface-900/60 border-y border-surface-800">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">Simple, Honest Pricing</h2>
          <div className="inline-block glass-card p-8 rounded-3xl border border-brand-500/30 max-w-md w-full shadow-2xl">
            <div className="text-4xl font-extrabold text-white font-mono">₹19</div>
            <div className="text-xs text-brand-300 font-semibold uppercase tracking-wider mt-1">per active employee / month</div>
            <p className="text-xs text-surface-400 mt-4 leading-relaxed">
              No hidden fees. Pay only for active employees doing field work. Deactivated staff do not count toward your monthly cost.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-white">All-in-One Fieldwork Infrastructure</h2>
          <p className="text-sm text-surface-400">Everything you need to monitor, organize, and evaluate field employees</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-surface-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-2xl border border-emerald-500/30">
              🛰️
            </div>
            <h3 className="text-lg font-bold text-white">Live GPS Tracking</h3>
            <p className="text-xs text-surface-400 leading-relaxed">
              Real-time OpenStreetMap Leaflet live map. Track employee location history with route path polylines. GPS tracking activates strictly during work sessions.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-surface-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-2xl border border-brand-500/30">
              ⏱️
            </div>
            <h3 className="text-lg font-bold text-white">Shift Attendance</h3>
            <p className="text-xs text-surface-400 leading-relaxed">
              Automated start/stop work logging. Calculate exact daily working hours, shift start times, and location coordinates with date filtering.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-surface-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-2xl border border-purple-500/30">
              📋
            </div>
            <h3 className="text-lg font-bold text-white">Task Management</h3>
            <p className="text-xs text-surface-400 leading-relaxed">
              Assign work locations, set priority levels, and receive immediate status updates as field workers accept, start, and complete tasks.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-surface-800 text-center text-xs text-surface-500">
        &copy; {new Date().getFullYear()} FieldTrack SaaS. All rights reserved. ₹19/employee/month field management architecture.
      </footer>
    </div>
  );
}
