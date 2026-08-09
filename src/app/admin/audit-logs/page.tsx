'use client';

import React, { useState, useEffect } from 'react';

export default function AdminAuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, [search]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-logs?q=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Audit Logs</h1>
          <p className="text-xs text-surface-400">
            Immutable trail of administrative actions, owner registrations, and security events
          </p>
        </div>

        <input
          type="text"
          placeholder="Filter audit action, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 bg-surface-900 border border-surface-700 rounded-lg text-xs text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-64"
        />
      </div>

      <div className="glass-card rounded-2xl border border-surface-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-surface-400">Loading audit trail...</div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-surface-400">No audit log entries recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-surface-300">
              <thead className="bg-surface-900/80 text-surface-400 uppercase tracking-wider text-[10px] font-semibold border-b border-surface-800">
                <tr>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Performer</th>
                  <th className="py-3 px-4">Target User</th>
                  <th className="py-3 px-4">Metadata</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/60 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-800/30 transition-all">
                    <td className="py-3 px-4">
                      <span className="font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-surface-200">
                      {log.performer ? `${log.performer.name} (${log.performer.role})` : 'System / Self'}
                    </td>

                    <td className="py-3 px-4 text-surface-400">
                      {log.target ? log.target.name : '—'}
                    </td>

                    <td className="py-3 px-4 text-surface-400 max-w-xs truncate">
                      {log.metadata || '—'}
                    </td>

                    <td className="py-3 px-4 text-right text-surface-500">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
