'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const navItems = [
    { label: 'Overview Stats', href: '/admin', icon: '📊' },
    { label: 'Live Global Map', href: '/admin/map', icon: '🗺️' },
    { label: 'Owner Management', href: '/admin/owners', icon: '🏢' },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: '📜' },
  ];

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col text-surface-100">
      {/* Admin Header */}
      <header className="glass-panel sticky top-0 z-50 px-6 py-3 flex items-center justify-between border-b border-surface-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-600/30 text-lg">
            🛡️
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-white tracking-wide text-base">FieldTrack</span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full">
                Super Admin
              </span>
            </div>
            <p className="text-[11px] text-surface-400">Platform Control & Owner Authorization</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="text-xs text-surface-400 hover:text-surface-200 transition-all flex items-center gap-1"
          >
            🌐 Public Site
          </Link>
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 bg-surface-800 hover:bg-surface-700 text-xs font-semibold text-rose-400 hover:text-rose-300 rounded-lg border border-surface-700 transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-surface-900/60 border-r border-surface-800/80 p-4 hidden md:block space-y-6">
          <div>
            <h4 className="text-[10px] uppercase font-bold text-purple-400 tracking-wider mb-3 px-2">
              Admin Navigation
            </h4>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30 shadow-sm font-semibold'
                        : 'text-surface-400 hover:bg-surface-800/50 hover:text-surface-200'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/40 text-[11px] space-y-1">
            <span className="text-purple-300 font-semibold block">⚡ Commercial Status</span>
            <p className="text-surface-400">
              Pricing: <strong className="text-white">₹19/employee</strong>
            </p>
            <p className="text-surface-400">
              Payment Gateway: <strong className="text-amber-400">INACTIVE (₹0 MVP)</strong>
            </p>
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
