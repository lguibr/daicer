import { describe, it, expect, vi } from 'vitest';
import boundary from '../game-boundary';
const middleware = boundary({}, { strapi: { config: { get: () => '/api' } } });
function context(path, method = 'GET', query = {}, querystring = '') {
  return { path, method, query, querystring, throw: (status, message) => { throw Object.assign(new Error(message), { status }); } };
}
describe('REST game boundary', () => {
  it.each(['/api/rooms/1', '/api/rooms/', '/api/%72ooms/1', '/api/engine/execute', '/api/agent/execute', '/api/narrator/action', '/api/game-events', '/api/game-operations', '/api/time-frames', '/api/voxel-changes', '/api/turn-locks', '/api/knowledge-snippets/search'])('rejects %s', async (path) => {
    await expect(middleware(context(path), vi.fn())).rejects.toMatchObject({ status: 403 });
  });
  it('blocks nested population and generic catalog writes', async () => {
    await expect(middleware(context('/api/users/me', 'GET', { populate: { rooms: '*' } }), vi.fn())).rejects.toMatchObject({ status: 403 });
    await expect(middleware(context('/api/entities', 'GET', {}, 'populate%5Bsheets%5D=*'), vi.fn())).rejects.toMatchObject({ status: 403 });
    await expect(middleware(context('/api/users', 'GET', { filters: { rooms: { code: { $eq: 'secret' } } } }), vi.fn())).rejects.toMatchObject({ status: 403 });
    await expect(middleware(context('/api/entities/1', 'PUT'), vi.fn())).rejects.toMatchObject({ status: 403 });
  });
  it.each([['/graphql', 'POST'], ['/api/auth/local', 'POST'], ['/api/auth/local/register', 'POST'], ['/api/users/me', 'GET'], ['/admin/content-manager', 'POST']])('preserves %s', async (path, method) => {
    const next = vi.fn(); await middleware(context(path, method), next); expect(next).toHaveBeenCalledOnce();
  });
});
