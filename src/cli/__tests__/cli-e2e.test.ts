import { beforeEach, describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { exploreCommand, runExplore } from '@/cli/commands/explore';
import { getStrapi, stopStrapi } from '@/cli/utils/bootstrap';
import { ui } from '@/cli/utils/ui';

vi.mock('@/cli/utils/bootstrap', () => ({ getStrapi: vi.fn(), stopStrapi: vi.fn() }));
vi.mock('@/cli/utils/ui', () => ({ ui: { json: vi.fn() } }));

const CWD = path.resolve(__dirname, '../../..');

function runCli(args: string[]) {
  const result = spawnSync(process.execPath, [
    '-r', require.resolve('ts-node/register/transpile-only'),
    '-r', require.resolve('tsconfig-paths/register'),
    path.join(CWD, 'src/cli/index.ts'), ...args,
  ], {
    cwd: CWD,
    encoding: 'utf8',
    timeout: 15000,
    env: { ...process.env, STRAPI_URL: 'http://127.0.0.1:1/api' },
  });
  expect(result.error).toBeUndefined();
  return result;
}

function extractJSON(output: string): unknown {
  const startMarker = '__JSON_START__';
  const endMarker = '__JSON_END__';
  const start = output.indexOf(startMarker);
  const end = output.indexOf(endMarker, start + startMarker.length);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return JSON.parse(output.slice(start + startMarker.length, end).trim());
}

describe('CLI subprocess contracts without a running backend', () => {
  it('reports a failed connection as framed offline JSON', { timeout: 20000 }, () => {
    const result = runCli(['status', '--json']);
    expect(result.status).toBe(0);
    expect(extractJSON(result.stdout)).toMatchObject({ status: 'offline', error: expect.any(String) });
  });

  it('lists actual schemas without booting Strapi', { timeout: 20000 }, () => {
    const result = runCli(['schema', '--list', '--json']);
    expect(result.status).toBe(0);
    expect(extractJSON(result.stdout)).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'plugin::users-permissions.user' }),
      expect.objectContaining({ uid: 'api::entity-sheet.entity-sheet' }),
    ]));
  });

  it('rejects an explore request without a type before database startup', { timeout: 20000 }, () => {
    const result = runCli(['explore', '--json']);
    expect(result.status).toBe(1);
    expect(extractJSON(result.stdout)).toMatchObject({
      meta: { success: false, error: expect.stringContaining('--type') }, data: null,
    });
  });
});

describe('CLI explore contract with a mocked Strapi bootstrap boundary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('counts through the document API with the supplied filters and shuts down', async () => {
    const count = vi.fn().mockResolvedValue(3);
    const documents = vi.fn(() => ({ count }));
    vi.mocked(getStrapi).mockResolvedValue({ documents });
    const filters = { name: { $contains: 'guard' } };

    await runExplore({ type: 'api::entity-sheet.entity-sheet', action: 'count', filters: JSON.stringify(filters), json: true });

    expect(documents).toHaveBeenCalledExactlyOnceWith('api::entity-sheet.entity-sheet');
    expect(count).toHaveBeenCalledExactlyOnceWith({ filters });
    expect(ui.json).toHaveBeenCalledExactlyOnceWith({
      meta: { type: 'api::entity-sheet.entity-sheet', action: 'count', filters }, data: 3,
    });
    expect(stopStrapi).toHaveBeenCalledTimes(1);
  });

  it('reports a rejected bootstrap dependency through the command handler', async () => {
    vi.mocked(getStrapi).mockRejectedValueOnce(new Error('fixture unavailable'));
    await expect(exploreCommand.parseAsync([
      '--type', 'api::entity-sheet.entity-sheet', '--action', 'count', '--json',
    ], { from: 'user' })).rejects.toThrow('fixture unavailable');
    expect(ui.json).toHaveBeenCalledExactlyOnceWith({
      meta: { success: false, error: 'fixture unavailable' }, data: null,
    });
  });
});
