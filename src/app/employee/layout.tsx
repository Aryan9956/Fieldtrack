'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    { label: 'Home', href: '/employee', icon: '🏠' },
    { label: 'My Tasks', href: '/employee/tasks', icon: '📋' },
    { label: 'Attendance', href: '/employee/attendance', icon: '⏱️' },
    { label: 'Profile', href: '/employee/profile', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col text-surface-100 pb-20 max-w-md mx-auto border-x border-surface-800 shadow-2xl">
      {/* Employee Header */}
      <header className="glass-panel sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b border-surface-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-md text-sm">
            F
          </div>
          <span className="font-extrabold text-white tracking-wide text-base">
            Field<span className="text-brand-400">Track</span> <span className="text-[10px] text-surface-400 font-normal">Employee</span>
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs text-surface-400 hover:text-rose-400 font-medium px-2 py-1 bg-surface-900 rounded border border-surface-800"
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">{children}</main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-900/95 backdrop-blur-md border-t border-surface-800 max-w-md mx-auto">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 transition-all ${
                  isActive ? 'text-brand-400 font-bold' : 'text-surface-400 hover:text-surface-200 font-medium'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
