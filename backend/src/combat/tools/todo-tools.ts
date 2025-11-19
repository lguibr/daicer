/**
 * Agent Todo Management Tools
 * Allow agents to create and track their own execution plans
 */

import { tool } from '@langchain/core/tools';
import type { GameplayState } from '@/graph/state';
import { createAgentTodo, updateAgentTodo, completeAgentTodo, listAgentTodos } from '@/services/agent-todos';
import { CreateTodoSchema, UpdateTodoSchema, CompleteTodoSchema } from '@/schemas/agent-todos';

/**
 * Create Todo Tool
 * Allows agent to create a new todo item in its execution plan
 */
export const createTodoTool = tool(
  async ({ agentContext, task, reasoning }, config) => {
    const state = config?.configurable?.state as GameplayState | undefined;
    if (!state) {
      return 'Error: No game state available';
    }

    const { roomId } = state;

    try {
      const todo = await createAgentTodo(roomId, {
        agentContext,
        task,
        reasoning,
      });

      return `Todo created successfully: "${task}" (ID: ${todo.id})`;
    } catch (error) {
      return `Error creating todo: ${(error as Error).message}`;
    }
  },
  {
    name: 'create_todo',
    description: `Create a new todo item to track a step in your execution plan. Use this when you need to break down a complex task into manageable steps.
    
Example: When processing a complex turn with multiple events, create todos for each major decision point.`,
    schema: CreateTodoSchema,
  }
);

/**
 * Update Todo Tool
 * Allows agent to update the status of an existing todo
 */
export const updateTodoTool = tool(
  async ({ todoId, status, blockedReason }, config) => {
    const state = config?.configurable?.state as GameplayState | undefined;
    if (!state) {
      return 'Error: No game state available';
    }

    const { roomId } = state;

    try {
      const todo = await updateAgentTodo(roomId, {
        todoId,
        status,
        blockedReason,
      });

      return `Todo updated: ${todo.task} → ${status}`;
    } catch (error) {
      return `Error updating todo: ${(error as Error).message}`;
    }
  },
  {
    name: 'update_todo',
    description: `Update the status of an existing todo. Use this to mark todos as in_progress, blocked, or cancelled.`,
    schema: UpdateTodoSchema,
  }
);

/**
 * Complete Todo Tool
 * Allows agent to mark a todo as complete
 */
export const completeTodoTool = tool(
  async ({ todoId, outcome }, config) => {
    const state = config?.configurable?.state as GameplayState | undefined;
    if (!state) {
      return 'Error: No game state available';
    }

    const { roomId } = state;

    try {
      const todo = await completeAgentTodo(roomId, { todoId, outcome });

      return `Todo completed: ${todo.task}${outcome ? ` - ${outcome}` : ''}`;
    } catch (error) {
      return `Error completing todo: ${(error as Error).message}`;
    }
  },
  {
    name: 'complete_todo',
    description: `Mark a todo as completed. Use this when you have finished a task in your execution plan.`,
    schema: CompleteTodoSchema,
  }
);

/**
 * List Todos Tool
 * Allows agent to view its current todos
 */
export const listTodosTool = tool(
  async ({ agentContext }, config) => {
    const state = config?.configurable?.state as GameplayState | undefined;
    if (!state) {
      return 'Error: No game state available';
    }

    const { roomId } = state;

    try {
      const result = await listAgentTodos(roomId, {
        agentContext,
        limit: 20,
      });

      if (result.todos.length === 0) {
        return 'No todos found. Consider creating a plan before executing complex tasks.';
      }

      const summary = `Todos Summary: ${result.pending} pending, ${result.inProgress} in progress, ${result.completed} completed, ${result.blocked} blocked

Recent todos:
${result.todos
  .slice(0, 10)
  .map((t) => `- [${t.status}] ${t.task}${t.reasoning ? ` (${t.reasoning})` : ''}`)
  .join('\n')}`;

      return summary;
    } catch (error) {
      return `Error listing todos: ${(error as Error).message}`;
    }
  },
  {
    name: 'list_todos',
    description: `List your current todos to review your execution plan. Optionally filter by agent context.`,
    schema: CreateTodoSchema.pick({ agentContext: true }).partial(),
  }
);

/**
 * Export all todo tools as an array for easy binding
 */
export const todoTools = [createTodoTool, updateTodoTool, completeTodoTool, listTodosTool];
