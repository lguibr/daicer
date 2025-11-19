/**
 * Agent Todo Service
 * Manages agent self-tracking todos stored in Firestore
 */

import { v4 as uuidv4 } from 'uuid';
import { getFirestore } from '@/config/firebase';
import { logger } from '@/utils/logger';
import type {
  AgentTodo,
  CreateTodoInput,
  UpdateTodoInput,
  CompleteTodoInput,
  ListTodosResponse,
  AgentTodoStatusType,
} from '@/schemas/agent-todos';

/**
 * Lazy-load Firestore to avoid initialization issues
 */
function getDb() {
  return getFirestore();
}

/**
 * Get todos collection reference for a room
 */
function getTodosCollection(roomId: string) {
  return getDb().collection('rooms').doc(roomId).collection('agentTodos');
}

/**
 * Create a new agent todo
 */
export async function createAgentTodo(roomId: string, input: CreateTodoInput): Promise<AgentTodo> {
  const todo: AgentTodo = {
    id: uuidv4(),
    agentContext: input.agentContext,
    task: input.task,
    status: 'pending',
    reasoning: input.reasoning,
    createdAt: Date.now(),
  };

  await getTodosCollection(roomId).doc(todo.id).set(todo);

  logger.info('[AgentTodo] Created', {
    roomId,
    todoId: todo.id,
    context: todo.agentContext,
    task: todo.task,
  });

  return todo;
}

/**
 * Update an existing agent todo
 */
export async function updateAgentTodo(roomId: string, input: UpdateTodoInput): Promise<AgentTodo> {
  const todoRef = getTodosCollection(roomId).doc(input.todoId);
  const doc = await todoRef.get();

  if (!doc.exists) {
    throw new Error(`Agent todo not found: ${input.todoId}`);
  }

  const todo = doc.data() as AgentTodo;
  const updates: Partial<AgentTodo> = {};

  if (input.status) {
    updates.status = input.status;
    if (input.status === 'completed' || input.status === 'cancelled') {
      updates.completedAt = Date.now();
    }
  }

  if (input.blockedReason !== undefined) {
    updates.blockedReason = input.blockedReason;
  }

  await todoRef.update(updates);

  const updated = { ...todo, ...updates };

  logger.info('[AgentTodo] Updated', {
    roomId,
    todoId: input.todoId,
    updates,
  });

  return updated;
}

/**
 * Complete an agent todo
 */
export async function completeAgentTodo(roomId: string, input: CompleteTodoInput): Promise<AgentTodo> {
  return updateAgentTodo(roomId, {
    todoId: input.todoId,
    status: 'completed',
  });
}

/**
 * List all agent todos for a room with optional filtering
 */
export async function listAgentTodos(
  roomId: string,
  options?: {
    status?: AgentTodoStatusType;
    agentContext?: string;
    limit?: number;
  }
): Promise<ListTodosResponse> {
  let query = getTodosCollection(roomId).orderBy('createdAt', 'desc');

  if (options?.status) {
    query = query.where('status', '==', options.status) as FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;
  }

  if (options?.agentContext) {
    query = query.where(
      'agentContext',
      '==',
      options.agentContext
    ) as FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const snapshot = await query.get();
  const todos = snapshot.docs.map((doc) => doc.data() as AgentTodo);

  // Calculate stats
  const stats = todos.reduce(
    (acc, todo) => {
      if (todo.status === 'pending') acc.pending += 1;
      else if (todo.status === 'in_progress') acc.inProgress += 1;
      else if (todo.status === 'completed') acc.completed += 1;
      else if (todo.status === 'blocked') acc.blocked += 1;
      return acc;
    },
    { pending: 0, inProgress: 0, completed: 0, blocked: 0 }
  );

  return {
    todos,
    ...stats,
  };
}

/**
 * Delete agent todo (for cleanup, not typically used by agents)
 */
export async function deleteAgentTodo(roomId: string, todoId: string): Promise<void> {
  await getTodosCollection(roomId).doc(todoId).delete();
  logger.info('[AgentTodo] Deleted', { roomId, todoId });
}

/**
 * Delete all completed todos for a room (cleanup)
 */
export async function cleanupCompletedTodos(roomId: string): Promise<number> {
  const snapshot = await getTodosCollection(roomId).where('status', '==', 'completed').get();

  const batch = getDb().batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  const count = snapshot.size;
  logger.info('[AgentTodo] Cleaned up completed todos', { roomId, count });

  return count;
}
