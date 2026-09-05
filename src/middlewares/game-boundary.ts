/** Public gameplay is accessed through the viewer GraphQL contract, not generic CRUD. */
const privateResources = new Set([
  'rooms', 'entity-sheets', 'turns', 'messages', 'game-events', 'time-frames', 'worlds',
  'dm-settings', 'knowledge-snippets', 'turn-locks', 'game-operations', 'voxel-changes', 'chunks', 'anchors', 'agent-logs',
  'engine', 'agent', 'narrator', 'game',
]);
export default (_config, { strapi }) => async (ctx, next) => {
  let path: string;
  try { path = decodeURIComponent(ctx.path).replace(/\/+$/, ''); } catch { ctx.throw(400, 'Invalid path.'); }
  const prefix = strapi.config.get('api.rest.prefix', '/api');
  if (!path.startsWith(`${prefix}/`)) return next();
  const resource = path.slice(prefix.length + 1).split('/')[0];
  // Authentication remains the users-permissions plugin's responsibility.
  if (resource === 'auth' || resource === 'connect') return next();
  if (privateResources.has(resource)) ctx.throw(403, 'Use the room lifecycle contract.');
  if (ctx.query?.populate != null || ctx.query?.filters != null || /(?:^|[&?])(?:populate|filters)(?:%5B|\[|=)/i.test(ctx.querystring ?? '')) {
    ctx.throw(403, 'Populated or filtered REST responses are unavailable.');
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(ctx.method)) ctx.throw(403, 'Public content writes are unavailable.');
  return next();
};
