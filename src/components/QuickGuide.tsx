import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Users,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

export const QuickGuide: React.FC<{ onNavigateToTranscript?: () => void }> = ({ onNavigateToTranscript }) => {
  const [isOpen, setIsOpen] = useState(true);
  const { user, quickLogin } = useAuth();
  const toast = useToast();

  const handleQuickSwitch = async (email: string, roleName: string) => {
    try {
      await quickLogin(email);
      toast.success('Role Switched', `Now viewing as ${roleName} (${email})`);
    } catch (err: any) {
      toast.error('Switch Failed', err.message);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/50 via-slate-900/80 to-slate-900/60 backdrop-blur-md p-5 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Running Guide & Quick Start</h3>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Easy 3 Steps
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Turn messy meeting notes into structured projects and assigned developer tasks using AI.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="self-start sm:self-center text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:bg-slate-800 transition-colors"
        >
          <span>{isOpen ? 'Minimize Guide' : 'Open Running Guide'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4 text-xs">
          {/* Step-by-Step Flow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                <span className="w-5 h-5 rounded-full bg-indigo-600/80 flex items-center justify-center text-[10px] font-bold text-white">
                  1
                </span>
                <span>Generate from Notes</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Click <strong>"Load Sample Meeting"</strong> (or paste notes), then click{' '}
                <strong className="text-white">"Turn Transcript into Projects"</strong>. AI extracts projects, managers,
                tasks, and deadlines while discarding rejected ideas.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                <span className="w-5 h-5 rounded-full bg-emerald-600/80 flex items-center justify-center text-[10px] font-bold text-white">
                  2
                </span>
                <span>Track Work Progress</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Open any project or visit <strong>My Tasks</strong>. Developers can click the status buttons (
                <span className="text-slate-200 font-medium">Pending</span>,{' '}
                <span className="text-amber-300 font-medium">In Progress</span>,{' '}
                <span className="text-emerald-300 font-medium">Completed</span>) to update work in real-time.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-sky-300 font-semibold">
                <span className="w-5 h-5 rounded-full bg-sky-600/80 flex items-center justify-center text-[10px] font-bold text-white">
                  3
                </span>
                <span>Check Role Permissions</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Every screen checks permissions: Project Managers see only projects they manage, and Developers see
                only tasks assigned to them. Run <strong>Permission Check</strong> for automated tests.
              </p>
            </div>
          </div>

          {/* 1-Click Role Switcher Quick Bar */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="font-semibold text-slate-200 text-[11px]">Quick Switch Persona:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickSwitch('admin@novaworks.example', 'Admin')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
                  user?.email === 'admin@novaworks.example'
                    ? 'bg-purple-950 text-purple-200 border-purple-600 font-bold'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>👑 System Admin</span>
                {user?.email === 'admin@novaworks.example' && <Check className="w-3 h-3 text-purple-400" />}
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch('ayesha@novaworks.example', 'PM Ayesha')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
                  user?.email === 'ayesha@novaworks.example'
                    ? 'bg-sky-950 text-sky-200 border-sky-600 font-bold'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>💼 PM Ayesha Khan (UrbanCart)</span>
                {user?.email === 'ayesha@novaworks.example' && <Check className="w-3 h-3 text-sky-400" />}
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch('ali@novaworks.example', 'Dev Ali')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
                  user?.email === 'ali@novaworks.example'
                    ? 'bg-emerald-950 text-emerald-200 border-emerald-600 font-bold'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>💻 Dev Ali Raza (Frontend)</span>
                {user?.email === 'ali@novaworks.example' && <Check className="w-3 h-3 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch('sara@novaworks.example', 'Dev Sara')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
                  user?.email === 'sara@novaworks.example'
                    ? 'bg-emerald-950 text-emerald-200 border-emerald-600 font-bold'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>📱 Dev Sara Noor (Mobile)</span>
                {user?.email === 'sara@novaworks.example' && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
