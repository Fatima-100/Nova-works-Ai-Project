import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  Calendar,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Filter,
  ArrowRight,
  Loader2,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { api } from '../lib/api';
import { Task, TaskStatus } from '../types';

interface MyTasksProps {
  onSelectProject?: (projectId: string) => void;
}

export const MyTasks: React.FC<MyTasksProps> = ({ onSelectProject }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMyTasks();
      setTasks(data.tasks);
      setTotalHours(data.totalAssignedHours);
    } catch (err: any) {
      console.error('Failed to load my tasks:', err);
      setError(err.message || 'Failed to fetch your tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, [user]);

  const handleStatusChange = async (task: Task, nextStatus: TaskStatus) => {
    if (task.status === nextStatus) return;

    try {
      setUpdatingTaskId(task.id);
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );

      await api.updateTask(task.id, { status: nextStatus });
      toast.success('Progress Updated', `"${task.title}" is now ${nextStatus}`);
    } catch (err: any) {
      toast.error('Update Failed', err.message);
      await fetchMyTasks();
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">My Tasks</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Personal task queue for <strong className="text-white">{user?.name}</strong> ({user?.specialization}).
          </p>
        </div>

        {/* Workload metric badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Tasks</span>
            <span className="text-base font-bold text-white font-mono">{tasks.length}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-center">
            <span className="text-[10px] text-emerald-300 uppercase font-semibold block">Total Effort</span>
            <span className="text-base font-bold text-emerald-200 font-mono">{totalHours}h</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Completed</span>
            <span className="text-base font-bold text-emerald-400 font-mono">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/30 text-rose-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-300">No Tasks Assigned to You</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {user?.role === 'AGENT'
              ? 'You do not have any tasks in your queue yet. An administrator or manager can create them from meeting notes.'
              : `You are signed in as a ${user?.role === 'ADMIN' ? 'Administrator' : 'Project Manager'}. Use the "Switch User" button at the top to try a developer profile (like Ali Raza or Hamza Shah).`}
          </p>
        </div>
      ) : (
        /* Task Cards List */
        <div className="space-y-3">
          {tasks.map((task) => {
            const status = task.status || 'Pending';
            const isCompleted = status === 'Completed';

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCompleted ? 'opacity-85' : ''
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      {task.projectName} ({task.clientName})
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Due {task.deadline}
                    </span>
                  </div>

                  <h3
                    className={`text-base font-bold text-white ${
                      isCompleted ? 'line-through text-slate-400' : ''
                    }`}
                  >
                    {task.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                    {task.description || 'Deliverable agreed in kickoff meeting.'}
                  </p>
                </div>

                {/* Right Action & Status */}
                <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-indigo-950 border border-indigo-800/60 text-indigo-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {task.estimatedHours}h
                  </span>

                  {/* 3-way Status Toggle */}
                  <div className="flex items-center gap-1.5">
                    <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                      {(['Pending', 'In Progress', 'Completed'] as const).map((s) => {
                        const isActive = status === s;
                        const colors = {
                          Pending: isActive
                            ? 'bg-slate-800 text-slate-100 border-slate-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-300',
                          'In Progress': isActive
                            ? 'bg-amber-950 text-amber-200 border-amber-700/60 shadow-sm'
                            : 'text-slate-500 hover:text-slate-300',
                          Completed: isActive
                            ? 'bg-emerald-950 text-emerald-200 border-emerald-700/60 shadow-sm'
                            : 'text-slate-500 hover:text-slate-300',
                        }[s];

                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleStatusChange(task, s)}
                            disabled={updatingTaskId === task.id}
                            className={`px-2 py-1 rounded-md text-[10px] font-semibold border border-transparent transition-all ${colors}`}
                            title={`Set status to ${s}`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                    {updatingTaskId === task.id && (
                      <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                    )}
                  </div>

                  {onSelectProject && (
                    <button
                      onClick={() => onSelectProject(task.projectId)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Open full project board"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
