import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, ProjectRecord, TaskRecord } from './server/db.js';
import { runSeed, SEED_PASSWORD } from './server/seed.js';
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getCurrentUser,
} from './server/session.js';
import {
  getProjects,
  getTasks,
  getProjectById,
  canCallTranscript,
} from './server/access.js';
import { processTranscriptWithAI } from './server/llm.js';
import {
  OFFICIAL_HACKATHON_TRANSCRIPT,
  CHANGED_INPUT_TEST_TRANSCRIPT,
  ADVERSARIAL_TEST_TRANSCRIPT,
} from './server/sampleTranscripts.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Initialize seed on startup if users table is empty
(async () => {
  const users = db.getUsers();
  if (users.length === 0) {
    console.log('[Startup] No users found. Initializing seed data...');
    await runSeed();
  }
})();

// Helper auth middleware
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  (req as any).user = user;
  next();
}

// ----------------- AUTH ROUTES -----------------

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password. Hint: default demo password is Demo123!' });
    }

    const token = await createSessionToken(user);
    setSessionCookie(res, token);

    return res.json({
      success: true,
      token, // Also return for testing or cross-environment flexibility
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        skills: JSON.parse(user.skills || '[]'),
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  clearSessionCookie(res);
  return res.json({ success: true, message: 'Logged out successfully.' });
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ user: null });
  }

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      specialization: user.specialization,
      skills: JSON.parse(user.skills || '[]'),
    },
  });
});

// ----------------- ACCESS-PROTECTED DATA ROUTES -----------------

/**
 * GET /api/projects
 * Enforces role access: ADMIN sees all, MANAGER sees managed, AGENT sees projects with their tasks.
 */
app.get('/api/projects', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const projects = getProjects(user);

  // Augment with metadata
  const userMap = new Map(db.getUsers().map((u) => [u.id, u.name]));
  const augmented = projects.map((p) => {
    const tasks = getTasks(user, p.id);
    const allProjectTasks = db.getTasks(p.id);
    const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalProjectHours = allProjectTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    const completedCount = tasks.filter((t) => t.status === 'Completed').length;

    return {
      ...p,
      managerName: userMap.get(p.managerId) || p.managerId,
      accessibleTaskCount: tasks.length,
      totalTaskCount: user.role === 'ADMIN' || (user.role === 'MANAGER' && p.managerId === user.id) ? allProjectTasks.length : tasks.length,
      completedTaskCount: completedCount,
      accessibleHours: totalHours,
      totalHours: user.role === 'ADMIN' || (user.role === 'MANAGER' && p.managerId === user.id) ? totalProjectHours : totalHours,
    };
  });

  return res.json({ projects: augmented });
});

/**
 * GET /api/projects/:id
 * Strict project detail + role-filtered tasks. Returns 403 if unauthorized.
 */
app.get('/api/projects/:id', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const projectId = req.params.id;

  const result = getProjectById(user, projectId);
  if (result.status !== 200) {
    return res.status(result.status).json({ error: result.error });
  }

  // Augment tasks with assignee names
  const userMap = new Map(db.getUsers().map((u) => [u.id, u]));
  const augmentedTasks = result.data.tasks.map((t) => ({
    ...t,
    assigneeName: userMap.get(t.assigneeId)?.name || t.assigneeId,
    assigneeSpecialization: userMap.get(t.assigneeId)?.specialization,
  }));

  return res.json({
    project: {
      ...result.data,
      tasks: augmentedTasks,
    },
  });
});

/**
 * GET /api/projects/:id/tasks
 * Returns tasks for project filtered by current user role.
 */
app.get('/api/projects/:id/tasks', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const projectId = req.params.id;

  const projectResult = getProjectById(user, projectId);
  if (projectResult.status !== 200) {
    return res.status(projectResult.status).json({ error: projectResult.error });
  }

  const tasks = getTasks(user, projectId);
  const userMap = new Map(db.getUsers().map((u) => [u.id, u.name]));

  return res.json({
    tasks: tasks.map((t) => ({
      ...t,
      assigneeName: userMap.get(t.assigneeId) || t.assigneeId,
    })),
  });
});

/**
 * POST /api/projects/:id/tasks
 * Allows project managers or admins to add a new task
 */
app.post('/api/projects/:id/tasks', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const projectId = req.params.id;
  const project = db.getProjectById(projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  if (user.role !== 'ADMIN' && project.managerId !== user.id) {
    return res.status(403).json({ error: 'Forbidden: Only the project manager or an administrator can add tasks.' });
  }

  const { title, description, assigneeId, deadline, estimatedHours } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Task title is required.' });
  }
  if (!assigneeId) {
    return res.status(400).json({ error: 'Please choose an assignee.' });
  }
  const assignee = db.getUserById(assigneeId);
  if (!assignee) {
    return res.status(400).json({ error: 'Assignee not found in directory.' });
  }

  const task = db.createTask({
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    projectId,
    title: title.trim(),
    description: description?.trim() || '',
    assigneeId,
    deadline: deadline || project.deadline,
    estimatedHours: Number(estimatedHours) || 8,
    status: 'Pending',
  });

  return res.json({ success: true, task });
});

/**
 * DELETE /api/tasks/:id
 */
app.delete('/api/tasks/:id', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const task = db.getTaskById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  const project = db.getProjectById(task.projectId);
  if (user.role !== 'ADMIN' && project?.managerId !== user.id) {
    return res.status(403).json({ error: 'Forbidden: Only the manager or an administrator can delete tasks.' });
  }
  db.deleteTask(task.id);
  return res.json({ success: true, message: 'Task removed.' });
});

/**
 * GET /api/my-tasks
 * Specifically for AGENTs (or any logged-in user to see their assigned tasks).
 */
app.get('/api/my-tasks', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const myTasks = db.getTasks().filter((t) => t.assigneeId === user.id);
  const projects = db.getProjects();
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const enriched = myTasks.map((t) => {
    const proj = projectMap.get(t.projectId);
    return {
      ...t,
      projectName: proj?.name || 'Unknown Project',
      clientName: proj?.clientName || 'Unknown Client',
      projectDeadline: proj?.deadline,
    };
  });

  const totalAssignedHours = enriched.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  return res.json({
    tasks: enriched,
    totalAssignedHours,
    taskCount: enriched.length,
  });
});

/**
 * GET /api/team
 * Read-only team directory with workload metrics (never exposes passwordHash or sensitive tokens).
 */
app.get('/api/team', requireAuth, async (req: Request, res: Response) => {
  const allUsers = db.getUsers();
  const allTasks = db.getTasks();
  const allProjects = db.getProjects();

  const directory = allUsers.map((u) => {
    const userTasks = allTasks.filter((t) => t.assigneeId === u.id);
    const managedProjects = allProjects.filter((p) => p.managerId === u.id);
    const assignedHours = userTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      specialization: u.specialization,
      skills: JSON.parse(u.skills || '[]'),
      assignedTaskCount: userTasks.length,
      managedProjectCount: managedProjects.length,
      assignedHours,
    };
  });

  return res.json({ team: directory });
});

/**
 * PATCH /api/tasks/:id
 * Allows updating estimatedHours or deadline with permission check
 */
app.patch('/api/tasks/:id', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const taskId = req.params.id;
  const { estimatedHours, deadline, title, description, status } = req.body;

  const task = db.getTaskById(taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  const project = db.getProjectById(task.projectId);

  // Permission check: ADMIN, managing PM, or task Assignee
  const isAuthorized =
    user.role === 'ADMIN' ||
    (user.role === 'MANAGER' && project?.managerId === user.id) ||
    task.assigneeId === user.id;

  if (!isAuthorized) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this task.' });
  }

  const updates: Partial<TaskRecord> = {};
  if (estimatedHours !== undefined) {
    const num = Number(estimatedHours);
    if (isNaN(num) || num <= 0) {
      return res.status(400).json({ error: 'Estimated hours must be a positive number.' });
    }
    updates.estimatedHours = num;
  }
  if (deadline !== undefined) {
    if (project && deadline > project.deadline) {
      return res.status(400).json({ error: `Task deadline cannot exceed project deadline (${project.deadline}).` });
    }
    updates.deadline = deadline;
  }
  if (title !== undefined && title.trim()) {
    updates.title = title.trim();
  }
  if (description !== undefined) {
    updates.description = description.trim();
  }
  if (status !== undefined) {
    if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be one of: Pending, In Progress, Completed' });
    }
    updates.status = status;
  }

  const updated = db.updateTask(taskId, updates);
  return res.json({ success: true, task: updated });
});

// ----------------- TRANSCRIPT AI PROCESSING -----------------

/**
 * POST /api/transcript
 * ADMIN only.
 * Extracts projects and tasks using AI with directory constraints.
 * Saves in ONE atomic transaction; rolls back on any failure.
 */
app.post('/api/transcript', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Enforce ADMIN permission
  if (!canCallTranscript(user)) {
    return res.status(403).json({
      error: `Access Denied: Only ADMIN can process meeting transcripts. User '${user.name}' has role '${user.role}'.`,
    });
  }

  const { transcript, previewOnly, replaceExisting } = req.body;

  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    return res.status(400).json({
      error: 'Meeting transcript is required and cannot be empty.',
    });
  }

  try {
    const result = await processTranscriptWithAI(transcript);

    if (!result.success || !result.data) {
      return res.status(422).json({
        error: result.error || 'Failed to extract valid project data from transcript.',
        validationErrors: result.validationErrors || [],
        rawOutput: result.rawOutput,
      });
    }

    const { projects, ignored } = result.data;

    // If preview mode was requested, return extracted data without saving
    if (previewOnly) {
      return res.json({
        preview: true,
        projects,
        ignored,
        modelUsed: result.modelUsed,
      });
    }

    // Save all projects and tasks in ONE atomic transaction
    const savedProjects = await db.transaction(async (tx) => {
      if (replaceExisting) {
        tx.clearProjectsAndTasks();
      }

      const createdList: any[] = [];
      let totalTasksCreated = 0;

      for (let pIdx = 0; pIdx < projects.length; pIdx++) {
        const p = projects[pIdx];
        const projectId = `proj_${Date.now()}_${pIdx + 1}`;

        const projectRecord: ProjectRecord = {
          id: projectId,
          name: p.name,
          clientName: p.clientName,
          description: p.description || '',
          managerId: p.managerId,
          deadline: p.deadline,
          createdAt: new Date().toISOString(),
        };

        tx.createProject(projectRecord);

        const createdTasks: TaskRecord[] = [];
        for (let tIdx = 0; tIdx < p.tasks.length; tIdx++) {
          const t = p.tasks[tIdx];
          const taskId = `task_${Date.now()}_${pIdx + 1}_${tIdx + 1}`;

          const taskRecord: TaskRecord = {
            id: taskId,
            projectId,
            title: t.title,
            description: t.description || '',
            assigneeId: t.assigneeId,
            deadline: t.deadline,
            estimatedHours: t.estimatedHours,
            status: (t.status as any) || 'Pending',
          };

          tx.createTask(taskRecord);
          createdTasks.push(taskRecord);
          totalTasksCreated++;
        }

        createdList.push({
          ...projectRecord,
          tasks: createdTasks,
          taskCount: createdTasks.length,
          totalHours: createdTasks.reduce((sum, item) => sum + item.estimatedHours, 0),
        });
      }

      // Record metadata and ignored features
      tx.setLastRunMeta(
        ignored,
        transcript.slice(0, 150) + '...',
        createdList.length,
        totalTasksCreated
      );

      return createdList;
    });

    return res.json({
      success: true,
      message: `Successfully created ${savedProjects.length} projects and ${savedProjects.reduce((s, p) => s + p.taskCount, 0)} tasks from transcript.`,
      projects: savedProjects,
      ignored,
      modelUsed: result.modelUsed,
      createdProjectsCount: savedProjects.length,
      createdTasksCount: savedProjects.reduce((s, p) => s + p.taskCount, 0),
    });
  } catch (err: any) {
    console.error('Transcript processing error:', err);
    return res.status(500).json({
      error: `Failed to process transcript: ${err.message || 'Unknown server error'}`,
    });
  }
});

/**
 * GET /api/transcript/meta
 * Returns last run metadata and ignored features
 */
app.get('/api/transcript/meta', requireAuth, (req: Request, res: Response) => {
  return res.json({
    lastRun: db.getLastTranscriptRun(),
    ignoredFeatures: db.getLastIgnoredFeatures(),
  });
});

/**
 * GET /api/sample-transcripts
 * Public sample presets for hackathon demo testing
 */
app.get('/api/sample-transcripts', (req: Request, res: Response) => {
  return res.json({
    official: OFFICIAL_HACKATHON_TRANSCRIPT,
    changedInput: CHANGED_INPUT_TEST_TRANSCRIPT,
    adversarial: ADVERSARIAL_TEST_TRANSCRIPT,
  });
});

/**
 * POST /api/seed/reset
 * Resets database and re-runs seed idempotently
 */
app.post('/api/seed/reset', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only ADMIN can reset system data.' });
  }

  const { resetProjectsOnly } = req.body;
  if (resetProjectsOnly) {
    db.clearProjectsAndTasks();
    return res.json({ success: true, message: 'All projects and tasks cleared.' });
  }

  db.resetAllData();
  const seedResult = await runSeed();
  return res.json({
    success: true,
    message: 'System data reset and re-seeded successfully.',
    userCount: seedResult.count,
  });
});

// ----------------- VITE DEVELOPMENT & PRODUCTION INTEGRATION -----------------

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`NovaWorks AI Project Manager Server running on port ${PORT}`);
    console.log(`Auth Seed: Admin & 9 Staff accounts ready (password: ${SEED_PASSWORD})`);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
