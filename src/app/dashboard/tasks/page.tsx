'use client';

import React, { useState, useEffect } from 'react';

export default function ManagerTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Task Form State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [location, setLocation] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, eRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/employees'),
      ]);

      if (tRes.ok) {
        const data = await tRes.json();
        setTasks(data.tasks || []);
      }
      if (eRes.ok) {
        const data = await eRes.json();
        setEmployees(data.employees || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          employeeId: employeeId || undefined,
          priority,
          location,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setTitle('');
        setDescription('');
        setLocation('');
        fetchData();
      }
    } catch (e) {
      alert('Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const pendingCount = tasks.filter((t) => t.status === 'ASSIGNED' || t.status === 'ACCEPTED').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Task Management</h1>
          <p className="text-xs text-surface-400">Assign work locations, set task priorities, and monitor field execution</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-lg shadow-lg flex items-center gap-1.5 transition-all"
        >
          + Create Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-surface-800 space-y-1">
          <span className="text-[10px] text-surface-400 uppercase font-semibold">Total Tasks</span>
          <div className="text-2xl font-extrabold text-white">{tasks.length}</div>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-surface-800 space-y-1">
          <span className="text-[10px] text-amber-400 uppercase font-semibold">Pending / Accepted</span>
          <div className="text-2xl font-extrabold text-amber-300">{pendingCount}</div>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-surface-800 space-y-1">
          <span className="text-[10px] text-brand-400 uppercase font-semibold">In Progress</span>
          <div className="text-2xl font-extrabold text-brand-300">{inProgressCount}</div>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-surface-800 space-y-1">
          <span className="text-[10px] text-emerald-400 uppercase font-semibold">Completed</span>
          <div className="text-2xl font-extrabold text-emerald-300">{completedCount}</div>
        </div>
      </div>

      {/* Task List Table */}
      <div className="glass-card rounded-2xl border border-surface-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-surface-400">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-surface-400">No tasks created yet. Click "+ Create Task" to assign work.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-surface-300">
              <thead className="bg-surface-900/80 text-surface-400 uppercase tracking-wider text-[10px] font-semibold border-b border-surface-800">
                <tr>
                  <th className="py-3 px-4">Task Title</th>
                  <th className="py-3 px-4">Assigned Employee</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/60">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-surface-800/30 transition-all">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{task.title}</div>
                      {task.description && <div className="text-surface-400 text-[11px] truncate max-w-xs">{task.description}</div>}
                    </td>

                    <td className="py-3.5 px-4 text-surface-200">
                      {task.employee ? task.employee.user.name : <span className="text-surface-500">Unassigned</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-800 text-brand-300 border border-surface-700">
                        {task.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-surface-400">
                      {task.location || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-brand-500/20 text-brand-300 border-brand-500/30'
                            : 'bg-surface-800 text-surface-400 border-surface-700'
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right text-surface-500 text-[11px]">
                      {new Date(task.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl border border-surface-800 space-y-4">
            <div className="flex justify-between items-center border-b border-surface-800 pb-3">
              <h3 className="text-base font-bold text-white">Assign New Field Task</h3>
              <button onClick={() => setShowModal(false)} className="text-surface-400 hover:text-white text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-300 uppercase tracking-wider mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Inspect Client Facility #402"
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-300 uppercase tracking-wider mb-1">
                  Assign to Employee
                </label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded text-xs text-white"
                >
                  <option value="">Select Employee (Optional)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user.name} ({emp.designation || 'Rep'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-300 uppercase tracking-wider mb-1">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded text-xs text-white"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-300 uppercase tracking-wider mb-1">
                  Target Location Address
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Andheri East Warehouse, Mumbai"
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-300 uppercase tracking-wider mb-1">
                  Task Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instructions for the field worker..."
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded text-xs text-white h-20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-surface-800 text-surface-300 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded text-xs font-bold shadow"
                >
                  {creating ? 'Assigning...' : 'Assign Task Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
