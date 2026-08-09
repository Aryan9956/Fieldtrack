'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push('/login');
        } else {
          setUser(data.user);
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    { label: 'Live Dashboard', href: '/dashboard', icon: '🗺️' },
    { label: 'Employees', href: '/dashboard/employees', icon: '👥' },
    { label: 'Task Board', href: '/dashboard/tasks', icon: '📋' },
    { label: 'Attendance', href: '/dashboard/attendance', icon: '⏱️' },
    { label: 'Reports', href: '/dashboard/reports', icon: '📊' },
    { label: 'Billing & Plan', href: '/dashboard/billing', icon: '💳' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const org = user?.ownedOrganization;

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col text-surface-100">
      {/* Manager Header */}
      <header className="glass-panel sticky top-0 z-50 px-6 py-3 flex items-center justify-between border-b border-surface-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20 text-lg">
            F
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-white tracking-wide text-base">FieldTrack</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                Workspace
              </span>
            </div>
            <p className="text-[11px] text-surface-400">
              {org?.name || 'Manager Portal'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex flex-col text-right text-xs">
            <span className="font-semibold text-white">{user?.name}</span>
            <span className="text-[11px] text-emerald-400 font-medium">Access: ACTIVE</span>
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-xs font-semibold text-surface-300 rounded-lg border border-surface-700 transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1">
        {/* Manager Sidebar */}
        <aside className="w-64 bg-surface-900/60 border-r border-surface-800/80 p-4 hidden md:block space-y-6">
          <div>
            <h4 className="text-[10px] uppercase font-bold text-surface-400 tracking-wider mb-3 px-2">
              Management Menu
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
                        ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-sm font-semibold'
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

          {/* Pricing Info Box */}
          <div className="p-3 bg-surface-900 rounded-xl border border-surface-800 text-[11px] space-y-1.5">
            <div className="flex justify-between text-surface-300 font-semibold">
              <span>Subscription</span>
              <span className="text-emerald-400">₹19/emp</span>
            </div>
            <p className="text-surface-400">
              Employee Limit: <strong className="text-white">{org?.employeeLimit || 0} max</strong>
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
