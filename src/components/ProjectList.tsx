import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Calendar,
  User,
  Clock,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Project } from '../types';
import { QuickGuide } from './QuickGuide';

interface ProjectListProps {
  onSelectProject: (projectId: string) => void;
  onNavigateToTranscript?: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onSelectProject, onNavigateToTranscript }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProjects();
      setProjects(data);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError(err.message || 'Failed to fetch projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const filtered = projects.filter((p) => {
    const query = search.toLowerCase();
    return p.name.toLowerCase().includes(query) || p.clientName.toLowerCase().includes(query);
  });

  const friendlyRoleName = {
    ADMIN: 'Administrator (All Projects View)',
    MANAGER: `Project Manager for ${user?.name}`,
    AGENT: `Developer Workspace for ${user?.name}`,
  }[user?.role || 'AGENT'];

  return (
    <div className="space-y-6">
      <QuickGuide onNavigateToTranscript={onNavigateToTranscript} />

      {/* Top Header & Role Filter Announcement */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Active Projects</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
              {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {user?.role === 'ADMIN' && 'Company-wide view: showing all projects and team deliverables.'}
            {user?.role === 'MANAGER' && `Showing projects you manage as Project Manager (${user.name}).`}
            {user?.role === 'AGENT' && `Showing projects where tasks are assigned to you (${user.name}).`}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search projects or clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
      </div>

      {/* Role View Notice */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            Current View: <strong className="text-white">{friendlyRoleName}</strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Use the top "Switch User" button to preview other roles
        </span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-300">No Projects Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {user?.role === 'ADMIN'
              ? 'No projects in the system yet. Go to AI Meeting Notes and click "Turn Transcript into Projects"!'
              : 'You have no assigned projects in this role. Switch to another team member to view their board.'}
          </p>
          {user?.role === 'ADMIN' && onNavigateToTranscript && (
            <button
              onClick={onNavigateToTranscript}
              className="mt-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Projects from Meeting Notes</span>
            </button>
          )}
        </div>
      ) : (
        /* Project Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((proj) => {
            const taskCount = proj.accessibleTaskCount ?? proj.totalTaskCount ?? 0;
            const hours = proj.accessibleHours ?? proj.totalHours ?? 0;

            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className="group rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/80 hover:bg-slate-900 p-5 shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Client & Deadline */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-indigo-400 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      {proj.clientName}
                    </span>
                    <span className="font-mono text-slate-400 flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Due {proj.deadline}
                    </span>
                  </div>

                  {/* Project Name */}
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {proj.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {proj.description || 'Sprint deliverables decided during team kickoff meeting.'}
                  </p>
                </div>

                {/* Footer Metrics */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-slate-400">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate max-w-[100px]">{proj.managerName || proj.managerId}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {proj.completedTaskCount !== undefined && proj.completedTaskCount > 0 && (
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">
                        {proj.completedTaskCount}/{taskCount} done
                      </span>
                    )}
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                      {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                    </span>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800/60 text-indigo-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {hours}h
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-slate-800 group-hover:bg-indigo-600 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors ml-1">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
