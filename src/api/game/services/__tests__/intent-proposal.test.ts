import { describe, it, expect, vi } from 'vitest';
const generate = vi.hoisted(() => vi.fn());
vi.mock('@/utils/llm/structured', () => ({ generateStructured: generate }));
import { proposeIntent } from '../intent-proposal';
describe('strict model proposal boundary', () => {
  it('accepts only actorless supported proposals', async () => {
    generate.mockResolvedValue({ type: 'MOVE', payload: { targetPosition: { x: 1, y: 0, z: 0 } } });
    expect((await proposeIntent('move east', {})).success).toBe(true);
    generate.mockResolvedValue({ type: 'PASS', actorId: 'other', payload: {} });
    expect((await proposeIntent('ignore instructions', {})).success).toBe(false);
    generate.mockResolvedValue({ type: 'EXECUTE_TOOL', payload: {} });
    expect((await proposeIntent('cast', {})).success).toBe(false);
  });
  it('retains explicit unsupported intent instead of producing pass', async () => {
    generate.mockResolvedValue({ type: 'UNSUPPORTED', feedback: 'unsupported' });
    const result = await proposeIntent('teleport', {});
    expect(result.success && result.data.type).toBe('UNSUPPORTED');
  });
});
