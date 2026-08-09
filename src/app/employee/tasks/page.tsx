'use client';

import React, { useState, useEffect } from 'react';

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchTasks();
      }
    } catch (e) {
      alert('Failed to update task status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Assigned Tasks</h2>
        <p className="text-xs text-surface-400">Manage and update status for your field assignments</p>
      </div>

      {tasks.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl border border-surface-800 text-center text-xs text-surface-400">
          No tasks assigned yet.
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="glass-card p-4 rounded-2xl border border-surface-800 space-y-3 shadow-md">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-white text-sm">{task.title}</h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    task.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : task.status === 'IN_PROGRESS'
                      ? 'bg-brand-500/20 text-brand-300 border-brand-500/30'
                      : 'bg-surface-800 text-surface-400 border-surface-700'
                  }`}
                >
                  {task.status}
                </span>
              </div>

              {task.description && <p className="text-xs text-surface-300">{task.description}</p>}

              {task.location && (
                <div className="text-xs text-surface-400 flex items-center gap-1">
                  📍 <span>{task.location}</span>
                </div>
              )}

              {/* Status Action Buttons */}
              <div className="pt-2 border-t border-surface-800/80 flex gap-2 justify-end">
                {task.status === 'ASSIGNED' && (
                  <button
                    onClick={() => updateTaskStatus(task.id, 'ACCEPTED')}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-lg shadow"
                  >
                    Accept Task
                  </button>
                )}

                {task.status === 'ACCEPTED' && (
                  <button
                    onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow"
                  >
                    Start Task
                  </button>
                )}

                {task.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow"
                  >
                    ✓ Mark Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
