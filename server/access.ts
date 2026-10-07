import { db, ProjectRecord, TaskRecord, UserRecord } from './db.js';

export interface ProjectWithTasks extends ProjectRecord {
  managerName?: string;
  tasks: TaskRecord[];
  totalHours: number;
  taskCount: number;
}

/**
 * Access Layer: Enforces strict Role-Based Access Control (RBAC).
 * Every API route and data request must query through these functions.
 */

/**
 * getProjects(user):
 * - ADMIN: all projects
 * - MANAGER: only projects where managerId == user.id
 * - AGENT: distinct projects containing tasks assigned to user (assigneeId == user.id)
 */
export function getProjects(user: UserRecord): ProjectRecord[] {
  const allProjects = db.getProjects();

  if (user.role === 'ADMIN') {
    return allProjects;
  }

  if (user.role === 'MANAGER') {
    return allProjects.filter((p) => p.managerId === user.id);
  }

  if (user.role === 'AGENT') {
    const userTasks = db.getTasks().filter((t) => t.assigneeId === user.id);
    const accessibleProjectIds = new Set(userTasks.map((t) => t.projectId));
    return allProjects.filter((p) => accessibleProjectIds.has(p.id));
  }

  return [];
}

/**
 * getTasks(user, projectId):
 * - ADMIN: all tasks in the project
 * - MANAGER: all tasks only if they manage the project (managerId == user.id); otherwise empty/denied
 * - AGENT: only tasks where assigneeId == user.id
 */
export function getTasks(user: UserRecord, projectId: string): TaskRecord[] {
  const project = db.getProjectById(projectId);
  if (!project) return [];

  const allProjectTasks = db.getTasks(projectId);

  if (user.role === 'ADMIN') {
    return allProjectTasks;
  }

  if (user.role === 'MANAGER') {
    if (project.managerId === user.id) {
      return allProjectTasks;
    }
    return []; // Not their project
  }

  if (user.role === 'AGENT') {
    return allProjectTasks.filter((t) => t.assigneeId === user.id);
  }

  return [];
}

/**
 * getProjectById(user, id):
 * - Returns null / throws if project not in getProjects(user)
 * - Returns project + filtered tasks according to getTasks(user, id)
 * - Notice: AGENT sees project metadata (name, client, manager, deadline) but NEVER other agents' tasks!
 */
export function getProjectById(user: UserRecord, projectId: string): { status: 200; data: ProjectWithTasks } | { status: 403 | 404; error: string } {
  const project = db.getProjectById(projectId);
  if (!project) {
    return { status: 404, error: `Project '${projectId}' not found.` };
  }

  // Check if project is in accessible projects
  const accessibleProjects = getProjects(user);
  const hasAccess = accessibleProjects.some((p) => p.id === projectId);

  if (!hasAccess) {
    return {
      status: 403,
      error: `Access Denied: User ${user.name} (${user.role}) is not authorized to view project '${project.name}'.`,
    };
  }

  const tasks = getTasks(user, projectId);
  const manager = db.getUserById(project.managerId);
  const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  return {
    status: 200,
    data: {
      ...project,
      managerName: manager?.name || project.managerId,
      tasks,
      totalHours,
      taskCount: tasks.length,
    },
  };
}

/**
 * Checks if user is permitted to invoke the AI transcript generation endpoint.
 * Only ADMIN is allowed.
 */
export function canCallTranscript(user: UserRecord): boolean {
  return user.role === 'ADMIN';
}
