import { z } from 'zod';
import { db } from './db.js';

export interface ValidationErrorItem {
  path: string;
  message: string;
  received?: unknown;
}

export const TaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().default(''),
  assigneeId: z.string().min(1, 'Assignee ID is required'),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be formatted YYYY-MM-DD'),
  estimatedHours: z.number().positive('Estimated hours must be greater than 0'),
  status: z.enum(['Pending', 'In Progress', 'Completed']).default('Pending').optional(),
});

export const ProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  clientName: z.string().min(1, 'Client name is required'),
  description: z.string().default(''),
  managerId: z.string().min(1, 'Manager ID is required'),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be formatted YYYY-MM-DD'),
  tasks: z.array(TaskSchema).min(1, 'Each project must have at least one task'),
});

export const TranscriptOutputSchema = z.object({
  projects: z.array(ProjectSchema).min(1, 'At least one project must be extracted'),
  ignored: z.array(z.string()).default([]),
});

export type ExtractedData = z.infer<typeof TranscriptOutputSchema>;

/**
 * Validates extracted LLM output against Zod schema and strict business rules:
 * 1. managerId must exist in database AND have role === 'MANAGER'
 * 2. assigneeId must exist in database AND have role === 'AGENT'
 * 3. dates must be valid calendar dates
 * 4. each task deadline must be <= project deadline
 * Returns list of specific errors with JSON paths.
 */
export function validateTranscriptOutput(data: unknown): {
  success: boolean;
  data?: ExtractedData;
  errors: ValidationErrorItem[];
} {
  const errors: ValidationErrorItem[] = [];

  // Step 1: Zod schema parsing
  const parsed = TranscriptOutputSchema.safeParse(data);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push({
        path: issue.path.join('.'),
        message: issue.message,
      });
    }
    return { success: false, errors };
  }

  const validData = parsed.data;
  const users = db.getUsers();
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Helper to validate date existence
  const isValidDate = (dateStr: string): boolean => {
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
  };

  // Step 2: Strict business rules validation
  validData.projects.forEach((proj, pIdx) => {
    const projPath = `projects[${pIdx}]`;

    // Validate project deadline date
    if (!isValidDate(proj.deadline)) {
      errors.push({
        path: `${projPath}.deadline`,
        message: `Invalid calendar date '${proj.deadline}'. Must be valid YYYY-MM-DD.`,
        received: proj.deadline,
      });
    }

    // Validate managerId
    const manager = userMap.get(proj.managerId);
    if (!manager) {
      errors.push({
        path: `${projPath}.managerId`,
        message: `Manager ID '${proj.managerId}' not found in team directory. Cannot assign unknown user.`,
        received: proj.managerId,
      });
    } else if (manager.role !== 'MANAGER') {
      errors.push({
        path: `${projPath}.managerId`,
        message: `User '${manager.name}' (${manager.id}) has role '${manager.role}'. Projects must be managed by a MANAGER.`,
        received: manager.role,
      });
    }

    // Validate tasks
    proj.tasks.forEach((task, tIdx) => {
      const taskPath = `${projPath}.tasks[${tIdx}]`;

      // Validate task deadline date
      if (!isValidDate(task.deadline)) {
        errors.push({
          path: `${taskPath}.deadline`,
          message: `Invalid calendar date '${task.deadline}'. Must be valid YYYY-MM-DD.`,
          received: task.deadline,
        });
      }

      // Check task deadline <= project deadline
      if (isValidDate(task.deadline) && isValidDate(proj.deadline)) {
        if (task.deadline > proj.deadline) {
          errors.push({
            path: `${taskPath}.deadline`,
            message: `Task deadline '${task.deadline}' cannot exceed project deadline '${proj.deadline}'.`,
            received: { taskDeadline: task.deadline, projectDeadline: proj.deadline },
          });
        }
      }

      // Validate assigneeId
      const assignee = userMap.get(task.assigneeId);
      if (!assignee) {
        errors.push({
          path: `${taskPath}.assigneeId`,
          message: `Assignee ID '${task.assigneeId}' not found in team directory. Non-directory persons (e.g., Kamran) must not be assigned.`,
          received: task.assigneeId,
        });
      } else if (assignee.role !== 'AGENT') {
        errors.push({
          path: `${taskPath}.assigneeId`,
          message: `User '${assignee.name}' (${assignee.id}) has role '${assignee.role}'. Tasks can only be assigned to AGENT developers.`,
          received: assignee.role,
        });
      }

      // Validate estimatedHours
      if (typeof task.estimatedHours !== 'number' || task.estimatedHours <= 0 || isNaN(task.estimatedHours)) {
        errors.push({
          path: `${taskPath}.estimatedHours`,
          message: `Estimated hours must be a positive number of developer effort hours.`,
          received: task.estimatedHours,
        });
      }
    });
  });

  return {
    success: errors.length === 0,
    data: errors.length === 0 ? validData : undefined,
    errors,
  };
}
