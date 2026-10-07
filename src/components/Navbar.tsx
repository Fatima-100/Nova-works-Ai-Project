import React, { useState } from 'react';
import {
  Sparkles,
  FolderKanban,
  CheckSquare,
  Users,
  ShieldCheck,
  LogOut,
  ChevronDown,
  RotateCcw,
  UserCheck,
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { useToast } from './Toast';
import { api } from '../lib/api';

interface NavbarProps {
  currentTab: 'admin' | 'projects' | 'my-tasks' | 'team' | 'security';
  onSelectTab: (tab: 'admin' | 'projects' | 'my-tasks' | 'team' | 'security') => void;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onRefreshData }) => {
  const { user, logout, quickLogin } = useAuth();
  const toast = useToast();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSwitchUser = async (email: string) => {
    try {
      setSwitcherOpen(false);
      await quickLogin(email);
      toast.success('Switched Persona', `Now active as ${email}`);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      toast.error('Switch Failed', err.message);
    }
  };

  const handleResetData = async (resetProjectsOnly = false) => {
    if (user?.role !== 'ADMIN') {
      toast.error('Forbidden', 'Only ADMIN can reset system data.');
      return;
    }
    try {
      setResetting(true);
      const res = await api.resetSeed(resetProjectsOnly);
      toast.success('System Reset', res.message);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      toast.error('Reset Failed', err.message);
    } finally {
      setResetting(false);
    }
  };

  const roleBadgeColor = {
    ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    MANAGER: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    AGENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  }[user?.role || 'AGENT'];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('projects')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                    NovaWorks
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                    AI CRM
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Infinity Hack '26</p>
              </div>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'admin'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Admin AI Studio</span>
              {user?.role !== 'ADMIN' && (
                <span className="text-[9px] uppercase px-1 py-0.2 bg-slate-800 text-slate-400 rounded border border-slate-700">
                  Admin Only
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('projects')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'projects'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-sky-400" />
              <span>Projects</span>
            </button>

            <button
              onClick={() => onSelectTab('my-tasks')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'my-tasks'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>My Tasks</span>
            </button>

            <button
              onClick={() => onSelectTab('team')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'team'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Team Directory</span>
            </button>

            <button
              onClick={() => onSelectTab('security')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'security'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Security Auditor</span>
            </button>
          </nav>

          {/* Right Section: Persona Switcher & User Profile */}
          <div className="flex items-center gap-3">
            {/* Quick Persona Switcher for Hackathon Judges */}
            <div className="relative">
              <button
                onClick={() => setSwitcherOpen(!switcherOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all shadow-sm"
                title="Quick switch account to test role permissions"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Role Switcher</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {switcherOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSwitcherOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-40 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 border-b border-slate-800/80">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Judge Demo Accounts
                      </p>
                      <p className="text-[10px] text-slate-500">Instant 1-click switch (password: Demo123!)</p>
                    </div>
                    <div className="max-h-72 overflow-y-auto py-1">
                      {DEMO_ACCOUNTS.map((acc) => {
                        const isCurrent = user?.id === acc.id;
                        return (
                          <button
                            key={acc.id}
                            onClick={() => handleSwitchUser(acc.email)}
                            className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-slate-800 ${
                              isCurrent ? 'bg-indigo-950/60 text-indigo-200 font-semibold' : 'text-slate-300'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="flex items-center gap-1.5">
                                {acc.label}
                                {isCurrent && <span className="text-[10px] text-indigo-400">● Active</span>}
                              </span>
                              <span className="text-[10px] text-slate-500">{acc.email}</span>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                              {acc.role}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {user?.role === 'ADMIN' && (
                      <div className="pt-2 px-3 border-t border-slate-800/80 flex items-center justify-between">
                        <button
                          onClick={() => handleResetData(true)}
                          disabled={resetting}
                          className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Clear Projects
                        </button>
                        <button
                          onClick={() => handleResetData(false)}
                          disabled={resetting}
                          className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Full Re-seed
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Current User Badge */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</span>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleBadgeColor}`}>
                      {user.role}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">{user.id}</span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60 overflow-x-auto text-xs">
          <button
            onClick={() => onSelectTab('admin')}
            className={`px-2 py-1 rounded ${currentTab === 'admin' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
          >
            Admin
          </button>
          <button
            onClick={() => onSelectTab('projects')}
            className={`px-2 py-1 rounded ${currentTab === 'projects' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
          >
            Projects
          </button>
          <button
            onClick={() => onSelectTab('my-tasks')}
            className={`px-2 py-1 rounded ${currentTab === 'my-tasks' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
          >
            My Tasks
          </button>
          <button
            onClick={() => onSelectTab('team')}
            className={`px-2 py-1 rounded ${currentTab === 'team' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
          >
            Team
          </button>
          <button
            onClick={() => onSelectTab('security')}
            className={`px-2 py-1 rounded ${currentTab === 'security' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
          >
            Security
          </button>
        </div>
      </div>
    </header>
  );
};
