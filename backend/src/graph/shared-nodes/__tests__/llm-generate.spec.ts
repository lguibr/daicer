import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { z } from 'zod';
import { createLLMGenerateNode, buildLLMContext } from '../llm-generate';

// Mock LangGraph task to bypass config requirements in unit tests
jest.mock('@langchain/langgraph', () => ({
  task: (name: string, fn: Function) => fn,
}));

// Mock the LLM service
jest.mock('@/services/llm/structured');

import { generateStructuredTask } from '@/services/llm/structured';
const mockGenerateStructuredTask = generateStructuredTask as jest.MockedFunction<typeof generateStructuredTask>;

describe('createLLMGenerateNode', () => {
  const TestSchema = z.object({
    result: z.string(),
    count: z.number(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create task that calls generateStructuredTask', async () => {
    mockGenerateStructuredTask.mockResolvedValue({
      result: 'success',
      count: 42,
    });

    const generateTask = createLLMGenerateNode('test_task', {
      schema: TestSchema,
      systemPrompt: 'System prompt',
      userPrompt: 'User prompt',
      tags: ['test'],
    });

    const result = await generateTask({ language: 'en' });

    expect(mockGenerateStructuredTask).toHaveBeenCalledWith(
      expect.objectContaining({
        schema: TestSchema,
        language: 'en',
        tags: ['test'],
        system: 'System prompt',
        user: 'User prompt',
      })
    );

    expect(result).toEqual({ result: 'success', count: 42 });
  });

  it('should use default language if not provided', async () => {
    mockGenerateStructuredTask.mockResolvedValue({ result: 'ok', count: 1 });

    const generateTask = createLLMGenerateNode('test', {
      schema: TestSchema,
      systemPrompt: 'System',
      userPrompt: 'User',
    });

    await generateTask({});

    expect(mockGenerateStructuredTask).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'en',
      })
    );
  });

  it('should pass userId if provided', async () => {
    mockGenerateStructuredTask.mockResolvedValue({ result: 'ok', count: 1 });

    const generateTask = createLLMGenerateNode('test', {
      schema: TestSchema,
      systemPrompt: 'System',
      userPrompt: 'User',
    });

    await generateTask({ language: 'es', userId: 'user-123' });

    expect(mockGenerateStructuredTask).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
      })
    );
  });

  it('should validate result against schema', async () => {
    mockGenerateStructuredTask.mockResolvedValue({
      result: 'valid',
      count: 10,
    });

    const generateTask = createLLMGenerateNode('test', {
      schema: TestSchema,
      systemPrompt: 'System',
      userPrompt: 'User',
    });

    const result = await generateTask({ language: 'en' });

    expect(result).toEqual({ result: 'valid', count: 10 });
  });
});

describe('buildLLMContext', () => {
  it('should extract language from state', () => {
    const context = buildLLMContext({ language: 'es' });
    expect(context.language).toBe('es');
  });

  it('should use default language if not in state', () => {
    const context = buildLLMContext({});
    expect(context.language).toBe('en');
  });

  it('should include userId if provided', () => {
    const context = buildLLMContext({ language: 'en' }, 'user-456');
    expect(context.userId).toBe('user-456');
  });
});
