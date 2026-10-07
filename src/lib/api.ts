import { Project, Task, TeamMember, TranscriptProcessResponse, User } from '../types';

let cachedToken: string | null = null;

export function setApiToken(token: string | null) {
  cachedToken = token;
  if (token) {
    localStorage.setItem('novaworks_token', token);
  } else {
    localStorage.removeItem('novaworks_token');
  }
}

export function getApiToken(): string | null {
  if (!cachedToken) {
    cachedToken = localStorage.getItem('novaworks_token');
  }
  return cachedToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = getApiToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include', // sends cookies
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.error || `Request failed with status ${res.status}`;
    const error = new Error(errorMsg) as any;
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ success: boolean; user: User; token?: string }> {
    const res = await request<{ success: boolean; user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      setApiToken(res.token);
    }
    return res;
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setApiToken(null);
    }
  },

  async getMe(): Promise<User | null> {
    try {
      const res = await request<{ user: User | null }>('/api/auth/me');
      return res.user;
    } catch {
      return null;
    }
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    const res = await request<{ projects: Project[] }>('/api/projects');
    return res.projects;
  },

  async getProjectById(id: string): Promise<Project> {
    const res = await request<{ project: Project }>(`/api/projects/${id}`);
    return res.project;
  },

  async getProjectTasks(projectId: string): Promise<Task[]> {
    const res = await request<{ tasks: Task[] }>(`/api/projects/${projectId}/tasks`);
    return res.tasks;
  },

  // My Tasks
  async getMyTasks(): Promise<{ tasks: Task[]; totalAssignedHours: number; taskCount: number }> {
    return await request<{ tasks: Task[]; totalAssignedHours: number; taskCount: number }>('/api/my-tasks');
  },

  // Team
  async getTeam(): Promise<TeamMember[]> {
    const res = await request<{ team: TeamMember[] }>('/api/team');
    return res.team;
  },

  // Tasks
  async updateTask(
    taskId: string,
    updates: Partial<{ estimatedHours: number; deadline: string; title: string; description: string; status: Task['status'] }>
  ): Promise<Task> {
    const res = await request<{ success: boolean; task: Task }>(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.task;
  },

  // Transcript
  async processTranscript(params: {
    transcript: string;
    previewOnly?: boolean;
    replaceExisting?: boolean;
  }): Promise<TranscriptProcessResponse> {
    return await request<TranscriptProcessResponse>('/api/transcript', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getTranscriptMeta(): Promise<{ lastRun?: any; ignoredFeatures: string[] }> {
    return await request<{ lastRun?: any; ignoredFeatures: string[] }>('/api/transcript/meta');
  },

  async getSampleTranscripts(): Promise<{
    official: string;
    changedInput: string;
    adversarial: string;
  }> {
    return await request<{
      official: string;
      changedInput: string;
      adversarial: string;
    }>('/api/sample-transcripts');
  },

  // Seed Reset
  async resetSeed(resetProjectsOnly = false): Promise<{ success: boolean; message: string }> {
    return await request<{ success: boolean; message: string }>('/api/seed/reset', {
      method: 'POST',
      body: JSON.stringify({ resetProjectsOnly }),
    });
  },
};
