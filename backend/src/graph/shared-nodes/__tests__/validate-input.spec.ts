import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import { createValidateInputNode, ValidationError } from '../validate-input';

describe('createValidateInputNode', () => {
  const TestSchema = z.object({
    id: z.string().min(1),
    count: z.number().int().min(0).max(100),
    status: z.enum(['active', 'inactive']),
  });

  type TestState = z.infer<typeof TestSchema>;

  it('should return empty partial for valid state', async () => {
    const validateNode = createValidateInputNode(TestSchema, 'test_node');

    const validState: TestState = {
      id: 'test-123',
      count: 50,
      status: 'active',
    };

    const result = await validateNode(validState);

    expect(result).toEqual({});
  });

  it('should throw ValidationError for invalid state', async () => {
    const validateNode = createValidateInputNode(TestSchema, 'test_node');

    const invalidState = {
      id: '', // Invalid: empty string
      count: 50,
      status: 'active',
    } as TestState;

    await expect(validateNode(invalidState)).rejects.toThrow(ValidationError);
    await expect(validateNode(invalidState)).rejects.toThrow('test_node input validation failed');
  });

  it('should include Zod errors in ValidationError context', async () => {
    const validateNode = createValidateInputNode(TestSchema, 'test_node');

    const invalidState = {
      id: 'valid',
      count: 150, // Invalid: > 100
      status: 'active',
    } as TestState;

    try {
      await validateNode(invalidState);
      fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const validationError = error as ValidationError;
      expect(validationError.context?.errors).toBeDefined();
      expect(validationError.context?.errors?.length).toBeGreaterThan(0);
    }
  });
});
