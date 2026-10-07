import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string; // PM01, DEV01, ADMIN
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT';
  specialization: string;
  skills: string; // JSON array string e.g. '["React","Node.js"]'
}

export interface ProjectRecord {
  id: string;
  name: string;
  clientName: string;
  description: string;
  managerId: string;
  deadline: string; // YYYY-MM-DD
  createdAt: string; // ISO date
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface TaskRecord {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  deadline: string; // YYYY-MM-DD
  estimatedHours: number;
  status: TaskStatus;
}

export interface DatabaseState {
  users: UserRecord[];
  projects: ProjectRecord[];
  tasks: TaskRecord[];
  lastIgnoredFeatures?: string[];
  lastTranscriptRun?: {
    timestamp: string;
    transcriptSummary: string;
    createdProjectsCount: number;
    createdTasksCount: number;
  };
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'db.json');

class DatabaseEngine {
  private state: DatabaseState = {
    users: [],
    projects: [],
    tasks: [],
    lastIgnoredFeatures: [],
  };

  private isLoaded = false;

  constructor() {
    this.ensureLoaded();
  }

  private ensureLoaded() {
    if (this.isLoaded) return;
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.state = JSON.parse(raw);
        // Ensure all loaded tasks have status
        if (Array.isArray(this.state.tasks)) {
          this.state.tasks.forEach((t) => {
            if (!t.status) {
              t.status = 'Pending';
            }
          });
        }
      } else {
        this.saveToDisk();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Failed to load database from disk:', err);
      this.state = { users: [], projects: [], tasks: [], lastIgnoredFeatures: [] };
      this.isLoaded = true;
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.state, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write database to disk:', err);
    }
  }

  // Deep clone state for transaction support
  private cloneState(state: DatabaseState): DatabaseState {
    return JSON.parse(JSON.stringify(state));
  }

  // --- Transactions ---
  public async transaction<T>(callback: (tx: DatabaseEngine) => Promise<T> | T): Promise<T> {
    this.ensureLoaded();
    const backupState = this.cloneState(this.state);
    try {
      const result = await callback(this);
      this.saveToDisk();
      return result;
    } catch (error) {
      // Rollback on any failure!
      this.state = backupState;
      this.saveToDisk();
      throw error;
    }
  }

  // --- Users ---
  public getUsers(): UserRecord[] {
    this.ensureLoaded();
    return [...this.state.users];
  }

  public getUserById(id: string): UserRecord | undefined {
    this.ensureLoaded();
    return this.state.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): UserRecord | undefined {
    this.ensureLoaded();
    const clean = email.trim().toLowerCase();
    return this.state.users.find((u) => u.email.trim().toLowerCase() === clean);
  }

  public upsertUser(user: UserRecord): UserRecord {
    this.ensureLoaded();
    const index = this.state.users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase() || u.id === user.id);
    if (index >= 0) {
      this.state.users[index] = { ...this.state.users[index], ...user };
    } else {
      this.state.users.push(user);
    }
    this.saveToDisk();
    return user;
  }

  // --- Projects ---
  public getProjects(): ProjectRecord[] {
    this.ensureLoaded();
    return [...this.state.projects];
  }

  public getProjectById(id: string): ProjectRecord | undefined {
    this.ensureLoaded();
    return this.state.projects.find((p) => p.id === id);
  }

  public createProject(project: ProjectRecord): ProjectRecord {
    this.ensureLoaded();
    this.state.projects.push(project);
    return project;
  }

  public deleteProject(id: string): boolean {
    this.ensureLoaded();
    const beforeCount = this.state.projects.length;
    this.state.projects = this.state.projects.filter((p) => p.id !== id);
    // Cascade delete tasks
    this.state.tasks = this.state.tasks.filter((t) => t.projectId !== id);
    this.saveToDisk();
    return this.state.projects.length < beforeCount;
  }

  public clearProjectsAndTasks(): void {
    this.ensureLoaded();
    this.state.projects = [];
    this.state.tasks = [];
    this.saveToDisk();
  }

  // --- Tasks ---
  public getTasks(projectId?: string): TaskRecord[] {
    this.ensureLoaded();
    if (projectId) {
      return this.state.tasks.filter((t) => t.projectId === projectId);
    }
    return [...this.state.tasks];
  }

  public getTaskById(id: string): TaskRecord | undefined {
    this.ensureLoaded();
    return this.state.tasks.find((t) => t.id === id);
  }

  public createTask(task: TaskRecord): TaskRecord {
    this.ensureLoaded();
    const withStatus: TaskRecord = {
      ...task,
      status: task.status || 'Pending',
    };
    this.state.tasks.push(withStatus);
    return withStatus;
  }

  public updateTask(id: string, updates: Partial<Omit<TaskRecord, 'id' | 'projectId'>>): TaskRecord | undefined {
    this.ensureLoaded();
    const task = this.state.tasks.find((t) => t.id === id);
    if (!task) return undefined;
    Object.assign(task, updates);
    this.saveToDisk();
    return task;
  }

  public deleteTask(id: string): boolean {
    this.ensureLoaded();
    const beforeCount = this.state.tasks.length;
    this.state.tasks = this.state.tasks.filter((t) => t.id !== id);
    this.saveToDisk();
    return this.state.tasks.length < beforeCount;
  }

  // --- Ignored Features & Run Metadata ---
  public setLastRunMeta(ignored: string[], transcriptSummary: string, createdProjectsCount: number, createdTasksCount: number) {
    this.ensureLoaded();
    this.state.lastIgnoredFeatures = ignored;
    this.state.lastTranscriptRun = {
      timestamp: new Date().toISOString(),
      transcriptSummary,
      createdProjectsCount,
      createdTasksCount,
    };
    this.saveToDisk();
  }

  public getLastIgnoredFeatures(): string[] {
    this.ensureLoaded();
    return this.state.lastIgnoredFeatures || [];
  }

  public getLastTranscriptRun() {
    this.ensureLoaded();
    return this.state.lastTranscriptRun;
  }

  public resetAllData(): void {
    this.state.projects = [];
    this.state.tasks = [];
    this.state.lastIgnoredFeatures = [];
    this.state.lastTranscriptRun = undefined;
    this.saveToDisk();
  }
}

export const db = new DatabaseEngine();
