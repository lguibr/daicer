import { describe, it, expect, vi } from 'vitest';
import * as entityLifecycle from '@/api/game/services/entity-lifecycle';

// Mock dependencies safely
vi.mock('@/utils/llm', () => ({ generateText: vi.fn().mockResolvedValue('text') }));
vi.mock('@/utils/prompt', () => ({ getPrompt: vi.fn().mockResolvedValue('prompt'), formatPrompt: vi.fn().mockReturnValue('formatted') }));
vi.mock('@/utils/upload', () => ({ uploadBase64Image: vi.fn().mockResolvedValue({ id: 1, url: 'url' }) }));
vi.mock('@/api/game/src/engine', () => ({
  createCharacterSnapshot: vi.fn().mockReturnValue({ hp: 10 }),
  formatDmInstruction: vi.fn().mockReturnValue('style'),
  EntityDeriver: { derive: vi.fn().mockReturnValue({ level: 1, hp: 10, maxHp: 10, ac: 10, speed: { walk: 30 } }) }
}));

describe('Entity Lifecycle Synthetic Coverage', () => {
  it('loads module and exports the service factory', () => {
    expect(entityLifecycle).toBeDefined();
    expect(typeof entityLifecycle.default).toBe('function');
  });

  it('covers createSnapshot branches', () => {
    const service = entityLifecycle.default({ strapi: {} as any });
    const snap = service.createSnapshot([{ documentId: 'doc-1', hp: 10 }, null, 'invalid']);
    expect(snap).toHaveProperty('doc-1');
  });

  it('covers onboardPlayer - aborts on missing room', async () => {
    const strapiMock = {
      documents: vi.fn().mockReturnValue({ findOne: vi.fn().mockResolvedValue(null) }),
      log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    };
    const service = entityLifecycle.default({ strapi: strapiMock as any });
    await expect(service.onboardPlayer('room-1', { name: 'Player 1' }, { documentId: 'user-1', id: '1', username: 'Test' })).rejects.toThrow('Room unavailable');
  });

  it('covers generateEntityOpening paths', async () => {
    const service = entityLifecycle.default({ strapi: {} as any });
    const sheet = { name: 'Hero', race: 'Human', class: 'Fighter', backstory: 'Farmboy', attributes: { Strength: 18 } };
    const res = await service.generateEntityOpening('World is dark', sheet as any, 'Save the king', 'en', { dmStyle: 'grim' });
    expect(res).toBe('text'); // from mock
  });

  it('covers generateMainOpening paths', async () => {
    const service = entityLifecycle.default({ strapi: {} as any });
    const players = [{ name: 'Player1', characterSheet: { name: 'Hero', race: 'Human', class: 'Fighter', description: 'Tall' } }];
    const res = await service.generateMainOpening('World description', players as any, 'en', { dmStyle: 'grim' });
    expect(res).toBe('text'); // from mock
  });
});


