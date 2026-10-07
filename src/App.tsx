import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { TranscriptStudio } from './components/TranscriptStudio';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { MyTasks } from './components/MyTasks';
import { TeamDirectory } from './components/TeamDirectory';
import { SecurityAuditor } from './components/SecurityAuditor';
import { Sparkles } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<'admin' | 'projects' | 'my-tasks' | 'team' | 'security'>('admin');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-xs font-mono text-slate-400">Loading NovaWorks AI Project Manager...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentTab('projects');
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
  };

  const handleTabChange = (tab: 'admin' | 'projects' | 'my-tasks' | 'team' | 'security') => {
    setSelectedProjectId(null);
    setCurrentTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleTabChange}
        onRefreshData={() => setSelectedProjectId(null)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'admin' && (
          <TranscriptStudio onSuccessNavigate={() => handleTabChange('projects')} />
        )}

        {currentTab === 'projects' && (
          <>
            {selectedProjectId ? (
              <ProjectDetail projectId={selectedProjectId} onBack={handleBackToProjects} />
            ) : (
              <ProjectList
                onSelectProject={handleSelectProject}
                onNavigateToTranscript={() => handleTabChange('admin')}
              />
            )}
          </>
        )}

        {currentTab === 'my-tasks' && (
          <MyTasks onSelectProject={handleSelectProject} />
        )}

        {currentTab === 'team' && <TeamDirectory />}

        {currentTab === 'security' && <SecurityAuditor />}
      </main>

      {/* Modern Status Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            NovaWorks AI Project Manager · Infinity Hack '26 MVP · Next.js / Express Full-Stack Architecture
          </p>
          <p className="font-mono text-[11px] text-slate-400">
            Current User: <span className="text-slate-200">{user.email}</span> ({user.role})
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
