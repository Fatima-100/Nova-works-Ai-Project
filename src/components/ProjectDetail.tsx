import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Briefcase,
  User,
  Clock,
  ShieldCheck,
  Edit2,
  Check,
  X,
  AlertCircle,
  Lock,
  Layers,
  CheckCircle2,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { api } from '../lib/api';
import { Project, Task, TaskStatus } from '../types';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);

  // Inline editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editHours, setEditHours] = useState<number>(0);
  const [editDeadline, setEditDeadline] = useState<string>('');
  const [editStatus, setEditStatus] = useState<TaskStatus>('Pending');
  const [savingTask, setSavingTask] = useState(false);
  const [updatingStatusTaskId, setUpdatingStatusTaskId] = useState<string | null>(null);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProjectById(projectId);
      setProject(data);
    } catch (err: any) {
      console.error('Failed to load project details:', err);
      setError({
        status: err.status,
        message: err.message || 'Unable to load project.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId, user]);

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditHours(task.estimatedHours);
    setEditDeadline(task.deadline);
    setEditStatus(task.status || 'Pending');
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
  };

  const saveEdit = async (taskId: string) => {
    try {
      setSavingTask(true);
      const updated = await api.updateTask(taskId, {
        estimatedHours: editHours,
        deadline: editDeadline,
        status: editStatus,
      });

      toast.success('Task Updated', `Saved ${updated.title} (${updated.estimatedHours}h, ${updated.status})`);
      setEditingTaskId(null);
      await fetchProject();
    } catch (err: any) {
      toast.error('Update Failed', err.message);
    } finally {
      setSavingTask(false);
    }
  };

  const handleUpdateStatus = async (task: Task, nextStatus: TaskStatus) => {
    if (task.status === nextStatus) return;

    try {
      setUpdatingStatusTaskId(task.id);
      // Optimistic update
      setProject((prev) => {
        if (!prev || !prev.tasks) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)),
        };
      });

      await api.updateTask(task.id, { status: nextStatus });
      toast.success('Progress Updated', `"${task.title}" is now ${nextStatus}`);
    } catch (err: any) {
      toast.error('Update Failed', err.message);
      await fetchProject();
    } finally {
      setUpdatingStatusTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded-lg" />
        <div className="h-40 bg-slate-900 rounded-xl" />
        <div className="h-64 bg-slate-900 rounded-xl" />
      </div>
    );
  }

  // Handle 403 Forbidden or 404 Not Found per Hackathon Access Rules!
  if (error || !project) {
    const isForbidden = error?.status === 403;
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-8 text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-14 h-14 rounded-full bg-rose-950/80 border border-rose-800 flex items-center justify-center mx-auto text-rose-400">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">
            {isForbidden ? '403 Forbidden - Access Denied' : 'Project Not Found'}
          </h2>
          <p className="text-sm text-rose-200/80 mt-2">
            {error?.message ||
              `User ${user?.name} (${user?.role}) does not have permission to view project ${projectId}.`}
          </p>
          <div className="mt-3 p-3 rounded-lg bg-rose-900/30 border border-rose-800/40 text-xs font-mono text-rose-300 text-left">
            Rule Enforced in server/access.ts:
            <br />
            - AGENT: restricted to projects with their tasks
            <br />
            - MANAGER: restricted to managed projects (managerId == user.id)
          </div>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects List
        </button>
      </div>
    );
  }

  const tasks = project.tasks || [];
  const totalEffortHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>

        <span className="text-[11px] font-mono text-slate-500">ID: {project.id}</span>
      </div>

      {/* Project Banner Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                {project.clientName}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Project Deadline: <span className="font-mono text-slate-200">{project.deadline}</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{project.name}</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {project.description || 'Sprint MVP Deliverables generated from meeting kickoff transcript.'}
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Project Manager</p>
              <p className="text-xs font-bold text-slate-200 mt-0.5">{project.managerName || project.managerId}</p>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-indigo-950/70 border border-indigo-800/60 text-center">
              <p className="text-[10px] text-indigo-300 uppercase font-semibold">Total Effort</p>
              <p className="text-lg font-bold text-white font-mono mt-0.5">{totalEffortHours}h</p>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-center min-w-[110px]">
              <p className="text-[10px] text-emerald-300 uppercase font-semibold">Progress</p>
              <p className="text-lg font-bold text-emerald-200 font-mono mt-0.5">{progressPercent}%</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Deliverables: <strong className="text-white">{completedCount}</strong> of{' '}
              <strong className="text-white">{tasks.length}</strong> Completed
              {inProgressCount > 0 && (
                <span className="text-amber-400 ml-2">({inProgressCount} in progress)</span>
              )}
            </span>
            <span className="font-mono text-[11px] text-slate-500">{progressPercent}% done</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(completedCount / (tasks.length || 1)) * 100}%` }}
            />
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${(inProgressCount / (tasks.length || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Role Privacy Alert */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {user?.role === 'ADMIN' && (
                <>
                  <strong className="text-white">Admin Privileges:</strong> Full visibility of all project tasks and
                  assigned engineers.
                </>
              )}
              {user?.role === 'MANAGER' && (
                <>
                  <strong className="text-white">Manager Oversight:</strong> Showing all tasks for this project you
                  manage.
                </>
              )}
              {user?.role === 'AGENT' && (
                <>
                  <strong className="text-emerald-300">Role Privacy Active:</strong> Showing only tasks assigned to you
                  ({user.name}). Tasks owned by other agents are hidden.
                </>
              )}
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            {tasks.length} task{tasks.length === 1 ? '' : 's'} displayed
          </span>
        </div>
      </div>

      {/* Task Table Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Task Breakdown
          </h2>
          <span className="text-xs text-slate-400">
            Click status toggle to update progress · Edit button for hours & deadlines
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No tasks found for your role in this project.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Task Title & Scope</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Effort</th>
                  <th className="py-3 px-4">Work Progress (Status)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {tasks.map((task) => {
                  const isEditing = editingTaskId === task.id;
                  const isMine = task.assigneeId === user?.id;
                  const canModify =
                    user?.role === 'ADMIN' ||
                    (user?.role === 'MANAGER' && project.managerId === user?.id) ||
                    task.assigneeId === user?.id;
                  const isUpdatingStatus = updatingStatusTaskId === task.id;

                  const status = task.status || 'Pending';

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isMine ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Title & Description */}
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                          <span className={status === 'Completed' ? 'line-through text-slate-400' : ''}>
                            {task.title}
                          </span>
                          {isMine && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900/70 text-indigo-300 font-mono">
                              My Task
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          {task.description || 'Sprint deliverable as agreed in meeting recap.'}
                        </p>
                      </td>

                      {/* Assignee */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                            {task.assigneeId.slice(0, 3)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-200">{task.assigneeName || task.assigneeId}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{task.assigneeId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Deadline */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editDeadline}
                            max={project.deadline}
                            onChange={(e) => setEditDeadline(e.target.value)}
                            className="bg-slate-950 border border-indigo-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                          />
                        ) : (
                          <span className="text-slate-300">{task.deadline}</span>
                        )}
                      </td>

                      {/* Hours */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              max={200}
                              value={editHours}
                              onChange={(e) => setEditHours(Number(e.target.value))}
                              className="w-16 bg-slate-950 border border-indigo-500 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none"
                            />
                            <span className="text-slate-400">h</span>
                          </div>
                        ) : (
                          <span className="font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800/60 text-indigo-300">
                            {task.estimatedHours}h
                          </span>
                        )}
                      </td>

                      {/* Status UI Toggle & Progress Selector */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                            className="bg-slate-950 border border-indigo-500 rounded px-2.5 py-1 text-xs text-white focus:outline-none font-medium"
                          >
                            <option value="Pending">⏳ Pending</option>
                            <option value="In Progress">⚡ In Progress</option>
                            <option value="Completed">✓ Completed</option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {/* Interactive 3-way toggle for developers & managers */}
                            <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                              {(['Pending', 'In Progress', 'Completed'] as const).map((s) => {
                                const isActive = status === s;
                                const buttonColors = {
                                  Pending: isActive
                                    ? 'bg-slate-800 text-slate-200 border-slate-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-300',
                                  'In Progress': isActive
                                    ? 'bg-amber-950 text-amber-300 border-amber-700/60 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-300',
                                  Completed: isActive
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-300',
                                }[s];

                                return (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => handleUpdateStatus(task, s)}
                                    disabled={!canModify || isUpdatingStatus}
                                    className={`px-2 py-1 rounded-md text-[10px] font-semibold border border-transparent transition-all disabled:cursor-not-allowed ${buttonColors}`}
                                    title={
                                      canModify
                                        ? `Set status to ${s}`
                                        : 'Only assigned developer or manager can update status'
                                    }
                                  >
                                    {s === 'Pending' && 'Pending'}
                                    {s === 'In Progress' && 'In Progress'}
                                    {s === 'Completed' && 'Completed'}
                                  </button>
                                );
                              })}
                            </div>

                            {isUpdatingStatus && (
                              <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => saveEdit(task.id)}
                              disabled={savingTask}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                              title="Save Changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={savingTask}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          canModify && (
                            <button
                              onClick={() => startEdit(task)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Edit task hours, deadline, or status"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
