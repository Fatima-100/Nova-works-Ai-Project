import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  quickLogin: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_PASSWORD = 'Demo123!';

export const DEMO_ACCOUNTS = [
  { id: 'ADMIN', name: 'System Admin', email: 'admin@novaworks.example', role: 'ADMIN', label: '👑 Admin' },
  { id: 'PM01', name: 'Ayesha Khan', email: 'ayesha@novaworks.example', role: 'MANAGER', label: 'PM: UrbanCart' },
  { id: 'PM02', name: 'Bilal Ahmed', email: 'bilal@novaworks.example', role: 'MANAGER', label: 'PM: QuickServe' },
  { id: 'PM03', name: 'Hina Malik', email: 'hina@novaworks.example', role: 'MANAGER', label: 'PM: HelpDeskPro' },
  { id: 'DEV01', name: 'Ali Raza', email: 'ali@novaworks.example', role: 'AGENT', label: 'Dev: Frontend (Ali)' },
  { id: 'DEV02', name: 'Hamza Shah', email: 'hamza@novaworks.example', role: 'AGENT', label: 'Dev: Backend (Hamza)' },
  { id: 'DEV03', name: 'Sara Noor', email: 'sara@novaworks.example', role: 'AGENT', label: 'Dev: Mobile (Sara)' },
  { id: 'DEV04', name: 'Usman Tariq', email: 'usman@novaworks.example', role: 'AGENT', label: 'Dev: Integration (Usman)' },
  { id: 'DEV05', name: 'Zain Abbas', email: 'zain@novaworks.example', role: 'AGENT', label: 'Dev: AI (Zain)' },
  { id: 'DEV06', name: 'Maryam Asif', email: 'maryam@novaworks.example', role: 'AGENT', label: 'Dev: AI QA (Maryam)' },
] as const;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const current = await api.getMe();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
  };

  const quickLogin = async (email: string) => {
    await login(email, DEMO_PASSWORD);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, quickLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
