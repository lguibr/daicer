/**
 * Agent Todo Schemas
 * Used by agents to track their own execution plans
 */

import { z } from 'zod';

/**
 * Agent Todo Status
 */
export const AgentTodoStatus = z.enum(['pending', 'in_progress', 'completed', 'blocked', 'cancelled']);

export type AgentTodoStatusType = z.infer<typeof AgentTodoStatus>;

/**
 * Agent Todo Schema
 * Represents a single task in an agent's execution plan
 */
export const AgentTodoSchema = z.object({
  id: z.string().describe('Unique identifier for this todo'),
  agentContext: z
    .string()
    .describe('Context string identifying what the agent was doing (e.g., "combat-round-3", "turn-processing-thor")'),
  task: z.string().describe('Clear, actionable task description'),
  status: AgentTodoStatus,
  reasoning: z.string().optional().describe('Why the agent created this task'),
  createdAt: z.number().describe('Unix timestamp when created'),
  completedAt: z.number().optional().describe('Unix timestamp when completed or cancelled'),
  blockedReason: z.string().optional().describe('Why the task is blocked (if status is blocked)'),
});

export type AgentTodo = z.infer<typeof AgentTodoSchema>;

/**
 * Create Todo Input Schema
 * Used by agents to create new todos
 */
export const CreateTodoSchema = z.object({
  agentContext: z.string(),
  task: z.string(),
  reasoning: z.string().optional(),
});

export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;

/**
 * Update Todo Input Schema
 * Used by agents to update existing todos
 */
export const UpdateTodoSchema = z.object({
  todoId: z.string(),
  status: AgentTodoStatus.optional(),
  blockedReason: z.string().optional(),
});

export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;

/**
 * Complete Todo Input Schema
 * Used by agents to mark todos as complete
 */
export const CompleteTodoSchema = z.object({
  todoId: z.string(),
  outcome: z.string().optional().describe('Brief description of what was accomplished'),
});

export type CompleteTodoInput = z.infer<typeof CompleteTodoSchema>;

/**
 * List Todos Response Schema
 */
export const ListTodosResponseSchema = z.object({
  todos: z.array(AgentTodoSchema),
  pending: z.number(),
  inProgress: z.number(),
  completed: z.number(),
  blocked: z.number(),
});

export type ListTodosResponse = z.infer<typeof ListTodosResponseSchema>;
