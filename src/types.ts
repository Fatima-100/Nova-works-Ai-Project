export type UserRole = 'ADMIN' | 'MANAGER' | 'AGENT';

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  specialization: string;
  skills: string[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName?: string;
  assigneeSpecialization?: string;
  deadline: string; // YYYY-MM-DD
  estimatedHours: number;
  projectName?: string;
  clientName?: string;
  projectDeadline?: string;
  status: TaskStatus;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  description: string;
  managerId: string;
  managerName?: string;
  deadline: string; // YYYY-MM-DD
  createdAt: string;
  tasks?: Task[];
  accessibleTaskCount?: number;
  totalTaskCount?: number;
  completedTaskCount?: number;
  accessibleHours?: number;
  totalHours?: number;
  taskCount?: number;
}

export interface ValidationErrorItem {
  path: string;
  message: string;
  received?: unknown;
}

export interface TranscriptProcessResponse {
  success: boolean;
  message?: string;
  preview?: boolean;
  projects?: Project[];
  ignored?: string[];
  modelUsed?: string;
  createdProjectsCount?: number;
  createdTasksCount?: number;
  error?: string;
  validationErrors?: ValidationErrorItem[];
}

export interface TeamMember extends User {
  assignedTaskCount: number;
  managedProjectCount: number;
  assignedHours: number;
}
