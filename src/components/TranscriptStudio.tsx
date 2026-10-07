import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Clock,
  ShieldAlert,
  ArrowRight,
  Eye,
  Layers,
  Database,
  Cpu,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { api } from '../lib/api';
import { Project, TranscriptProcessResponse, ValidationErrorItem } from '../types';
import {
  OFFICIAL_HACKATHON_TRANSCRIPT,
  CHANGED_INPUT_TEST_TRANSCRIPT,
  ADVERSARIAL_TEST_TRANSCRIPT,
} from '../lib/sampleTranscripts';
import { QuickGuide } from './QuickGuide';

interface TranscriptStudioProps {
  onSuccessNavigate?: () => void;
}

export const TranscriptStudio: React.FC<TranscriptStudioProps> = ({ onSuccessNavigate }) => {
  const { user, quickLogin } = useAuth();
  const toast = useToast();

  const [samples, setSamples] = useState<{
    official: string;
    changedInput: string;
    adversarial: string;
  }>({
    official: OFFICIAL_HACKATHON_TRANSCRIPT,
    changedInput: CHANGED_INPUT_TEST_TRANSCRIPT,
    adversarial: ADVERSARIAL_TEST_TRANSCRIPT,
  });

  const [transcript, setTranscript] = useState(OFFICIAL_HACKATHON_TRANSCRIPT);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(true);

  const [lastResponse, setLastResponse] = useState<TranscriptProcessResponse | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorItem[]>([]);
  const [ignoredFeatures, setIgnoredFeatures] = useState<string[]>([]);
  const [lastRunMeta, setLastRunMeta] = useState<any>(null);

  const isAdmin = user?.role === 'ADMIN';

  // Load samples and metadata on mount
  useEffect(() => {
    async function loadData() {
      try {
        const sampleData = await api.getSampleTranscripts();
        if (sampleData && sampleData.official) {
          setSamples(sampleData);
          setTranscript((prev) => (prev ? prev : sampleData.official));
        }
      } catch {
        // Fall back gracefully to bundled presets
      }

      try {
        const meta = await api.getTranscriptMeta();
        if (meta.ignoredFeatures) setIgnoredFeatures(meta.ignoredFeatures);
        if (meta.lastRun) setLastRunMeta(meta.lastRun);
      } catch {
        // Ignore metadata fetch error on boot
      }
    }
    loadData();
  }, []);

  const handleProcess = async () => {
    if (!isAdmin) {
      toast.error('Admin Required', 'Please switch to an Administrator account to create projects.');
      return;
    }

    if (!transcript.trim()) {
      toast.warning('Empty Notes', 'Please paste meeting notes or click "Load Sample Meeting" first.');
      return;
    }

    setLoading(true);
    setLoadingStep(1);
    setValidationErrors([]);
    setLastResponse(null);

    // Step-by-step progress visualizer
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 850);

    try {
      const response = await api.processTranscript({
        transcript,
        previewOnly,
        replaceExisting,
      });

      clearInterval(stepInterval);
      setLoadingStep(5);
      setLastResponse(response);

      if (response.ignored) {
        setIgnoredFeatures(response.ignored);
      }

      if (response.preview) {
        toast.info('Preview Ready', 'Extracted projects preview without saving.');
      } else {
        toast.success(
          'Projects Ready!',
          `Created ${response.createdProjectsCount || 0} projects and ${response.createdTasksCount || 0} tasks safely.`
        );
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error('Processing error:', err);
      const errors = err.data?.validationErrors || [];
      setValidationErrors(errors);

      setLastResponse({
        success: false,
        error: err.message || 'Could not process meeting notes.',
        validationErrors: errors,
      });

      toast.error('Check Needed', err.message || 'Some items in the notes did not match our team guidelines.');
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { title: 'Reading Notes', desc: 'Checking meeting discussion and team roster' },
    { title: 'Confirming Decisions', desc: 'Using final agreed deadlines and owner recap' },
    { title: 'Checking Requirements', desc: 'Verifying dates, estimates, and team roles' },
    { title: 'Saving Projects', desc: 'Writing all projects and tasks safely to your board' },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Guide Banner at the Top */}
      <QuickGuide onNavigateToTranscript={() => {}} />

      {/* Top Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Turn Meeting Notes into Projects</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              AI Powered
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Paste meeting notes or discussion recap. Our AI reads the final decisions, assigns the right team members,
            and sets up your project boards.
          </p>
        </div>

        {/* Quick Action Buttons for Samples */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTranscript(samples.official)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 transition-colors flex items-center gap-1.5"
            title="Load full sprint kickoff meeting notes"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Load Sample Meeting
          </button>

          <button
            onClick={() => setTranscript(samples.changedInput)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
            title="Test changing hours & dates to verify AI responds dynamically"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Test Changed Values (12h/23 Oct)
          </button>

          <button
            onClick={() => setTranscript(samples.adversarial)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 transition-colors flex items-center gap-1.5"
            title="Test notes with missing members or dates beyond project deadline"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Test Warning Checks
          </button>

          <button
            onClick={() => setTranscript('')}
            disabled={loading}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            Clear Text
          </button>
        </div>
      </div>

      {/* Non-Admin Alert Banner */}
      {!isAdmin && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/30 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Administrator Privileges Needed</p>
              <p className="text-xs text-amber-300/80">
                You are currently viewing as <span className="font-bold">{user?.name}</span> ({user?.role}). To create
                company-wide projects from meeting notes, please switch to the Administrator account.
              </p>
            </div>
          </div>
          <button
            onClick={() => quickLogin('admin@novaworks.example')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shrink-0"
          >
            Switch to Administrator
          </button>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Textarea & Controls */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                Meeting Notes / Transcript
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                {transcript.length} characters
              </span>
            </div>

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              disabled={loading}
              placeholder="Paste your meeting notes here..."
              rows={16}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed resize-y selection:bg-indigo-600 selection:text-white"
            />

            {/* Execution Controls */}
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    disabled={loading}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Replace existing projects</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={previewOnly}
                    onChange={(e) => setPreviewOnly(e.target.checked)}
                    disabled={loading}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Preview only (don't save)</span>
                </label>
              </div>

              <button
                onClick={handleProcess}
                disabled={loading || !isAdmin || !transcript.trim()}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Notes with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Turn Transcript into Projects</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step-by-Step Progress Feedback while loading */}
          {loading && (
            <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/30 backdrop-blur-sm space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                  <Cpu className="w-4 h-4 animate-pulse text-indigo-400" />
                  Building Your Projects
                </p>
                <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                  Step {loadingStep} of 4
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {stepsList.map((step, idx) => {
                  const isCurrent = loadingStep === idx + 1;
                  const isDone = loadingStep > idx + 1;
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border transition-all ${
                        isCurrent
                          ? 'border-indigo-400/80 bg-indigo-900/50 text-white shadow-md'
                          : isDone
                          ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                          : 'border-slate-800 bg-slate-900/40 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-medium">
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : isCurrent ? (
                          <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                        )}
                        <span>{step.title}</span>
                      </div>
                      <p className="text-[10px] mt-0.5 opacity-80 pl-5">{step.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Ignored Features, Results & Validation Diagnostics */}
        <div className="lg:col-span-5 space-y-4">
          {/* Out of Scope / Ignored Items Panel */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Left Out of Scope (Decided in Meeting)
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {ignoredFeatures.length} items
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Ideas that were discussed but explicitly skipped or postponed during the meeting (like live payments,
              GPS maps, or external freelancers) were intentionally excluded from tasks.
            </p>

            {ignoredFeatures.length > 0 ? (
              <div className="space-y-1.5">
                {ignoredFeatures.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-slate-800 text-center text-xs text-slate-500">
                Process a meeting transcript to see which ideas were left out of scope.
              </div>
            )}
          </div>

          {/* Validation Diagnostics / Warning Panel */}
          {validationErrors.length > 0 && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  Issues Found in Notes ({validationErrors.length})
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-200">
                  Not Saved to Protect Data
                </span>
              </div>
              <p className="text-xs text-rose-200/80 leading-relaxed">
                The database did not save these changes because the meeting notes contain invalid assignments or dates.
                Please check:
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {validationErrors.map((err, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/50 text-xs text-rose-200 space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] text-rose-400">
                      <span>Field: {err.path}</span>
                    </div>
                    <p className="font-sans text-xs text-rose-100">{err.message}</p>
                    {err.received !== undefined && (
                      <div className="text-[10px] font-mono text-rose-300 bg-rose-900/40 px-1.5 py-0.5 rounded">
                        Found: {JSON.stringify(err.received)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Summary Card */}
          {lastResponse?.success && lastResponse.projects && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 shadow-xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Projects Created Successfully
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200">
                  Ready to Work
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Projects Created</p>
                  <p className="text-xl font-bold text-white mt-0.5">{lastResponse.projects.length}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Tasks Assigned</p>
                  <p className="text-xl font-bold text-white mt-0.5">
                    {lastResponse.projects.reduce((sum, p) => sum + (p.tasks?.length || p.taskCount || 0), 0)}
                  </p>
                </div>
              </div>

              {/* Projects Breakdown */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {lastResponse.projects.map((proj, pIdx) => {
                  const tasks = proj.tasks || [];
                  const hours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
                  return (
                    <div
                      key={pIdx}
                      className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-200">{proj.name}</p>
                        <p className="text-[11px] text-slate-400">
                          Due: <span className="font-mono text-slate-300">{proj.deadline}</span> · {tasks.length} tasks
                        </p>
                      </div>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800/60 text-indigo-300">
                        {hours}h
                      </span>
                    </div>
                  );
                })}
              </div>

              {onSuccessNavigate && (
                <button
                  onClick={onSuccessNavigate}
                  className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <span>Open Projects Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
