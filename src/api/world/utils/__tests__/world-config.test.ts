import { describe, expect, it } from 'vitest';
import { normalizeWorldConfig, requireWorldId, worldConfigHash } from '@/api/world/utils/world-config';

describe('World configuration normalization', () => {
  it('preserves zero and configured dimensions without mutating the document', () => {
    const doc = { seed: 'world', chunkSize: 16, roadDensity: 0, structureChance: 0, fogRadius: 0, detail: 0 };
    expect(normalizeWorldConfig(doc)).toMatchObject(doc);
    expect(doc).not.toHaveProperty('globalScale');
    expect(normalizeWorldConfig({}).chunkSize).toBe(32);
  });
  it('hashes the whole normalized config in stable order without document data', () => {
    const config = normalizeWorldConfig({ seed: 'same' });
    const reordered = Object.fromEntries(Object.entries(config).reverse());
    expect(worldConfigHash(reordered as any)).toBe(worldConfigHash(config));
    expect(worldConfigHash({ ...config, documentId: 'unrelated' } as any)).toBe(worldConfigHash(config));
    for (const [key, value] of Object.entries(config)) {
      const changed = { ...config, [key]: typeof value === 'string' ? 'different' : value === 0 ? 0.1 : value / 2 };
      expect(worldConfigHash(changed)).not.toBe(worldConfigHash(config));
    }
  });
  it.each([
    { chunkSize: 0 },
    { chunkSize: 16.5 },
    { chunkSize: 65 },
    { seed: '' },
    { detail: 99 },
    { seaLevel: NaN },
    { globalScale: Infinity },
    { roughness: -1 },
  ])('rejects invalid configuration %j', (value) => {
    expect(() => normalizeWorldConfig(value)).toThrow();
  });
  it.each([undefined, null, '', ' ', 12])('rejects absent or numeric world identity %j', (value) => {
    expect(() => requireWorldId(value as any)).toThrow(/World/);
  });
});
