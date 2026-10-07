import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  Briefcase,
  CheckSquare,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import { TeamMember } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

export const TeamDirectory: React.FC = () => {
  const { quickLogin } = useAuth();
  const toast = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'MANAGER' | 'AGENT'>('ALL');

  useEffect(() => {
    async function loadTeam() {
      try {
        setLoading(true);
        const data = await api.getTeam();
        setMembers(data);
      } catch (err: any) {
        console.error('Failed to load team directory:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, []);

  const filtered = members.filter((m) => {
    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    const query = search.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(query) ||
      m.specialization.toLowerCase().includes(query) ||
      m.skills.some((s) => s.toLowerCase().includes(query)) ||
      m.id.toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  const handlePersonaSwitch = async (email: string) => {
    try {
      await quickLogin(email);
      toast.success('Persona Switched', `Now logged in as ${email}`);
    } catch (err: any) {
      toast.error('Switch Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Team Directory</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {members.length} Members
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Internal engineering directory used by the AI engine to match project requirements and skillsets.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search name, skill, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs w-full sm:w-auto">
            {(
              [
                { key: 'ALL', label: 'All Team' },
                { key: 'MANAGER', label: 'Managers' },
                { key: 'AGENT', label: 'Developers' },
                { key: 'ADMIN', label: 'Admins' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRoleFilter(tab.key)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  roleFilter === tab.key ? 'bg-slate-800 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white">Strict Privacy Architecture:</strong> Passwords, credentials, and private
            data are completely omitted when this directory is transmitted to the AI engine.
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500 hidden md:inline">
          Format: &#123;id, name, role, specialization, skills&#125;
        </span>
      </div>

      {/* Team Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((member) => {
            const roleBadgeColor = {
              ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
              MANAGER: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
              AGENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
            }[member.role];

            return (
              <div
                key={member.id}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all duration-200"
              >
                <div>
                  {/* Top Bar: ID & Role */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                      {member.id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${roleBadgeColor}`}>
                      {member.role}
                    </span>
                  </div>

                  {/* Name & Email */}
                  <h3 className="text-base font-bold text-white">{member.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{member.email}</p>

                  {/* Specialization */}
                  <p className="text-xs font-medium text-amber-300/90 mt-2 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                    {member.specialization}
                  </p>

                  {/* Skills tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {member.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800/80 text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Metrics & Persona Quick Switch */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {member.role === 'AGENT' && (
                      <>
                        <span className="text-[11px] font-mono text-slate-400">
                          {member.assignedTaskCount} tasks
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-[11px] font-mono font-semibold text-emerald-400">
                          {member.assignedHours}h
                        </span>
                      </>
                    )}
                    {member.role === 'MANAGER' && (
                      <span className="text-[11px] font-mono text-sky-400">
                        {member.managedProjectCount} project managed
                      </span>
                    )}
                    {member.role === 'ADMIN' && (
                      <span className="text-[11px] font-mono text-purple-400">System Admin</span>
                    )}
                  </div>

                  <button
                    onClick={() => handlePersonaSwitch(member.email)}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                    title={`Switch active persona to ${member.name}`}
                  >
                    Login as {member.id}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
