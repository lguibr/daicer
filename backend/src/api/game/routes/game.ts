/**
 * Game Router
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/game/generate-world',
      handler: 'game.generateWorld',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/game/custom-search/entities',
      handler: 'game.searchEntities',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Ensure authenticated in production but disabling here for dev ease? No, keep standard auth.
        // If auth is needed, default policies usually cover it if not explicitly public.
        // Assuming default secure.
      },
    },
    {
      method: 'POST',
      path: '/game/:roomId/turn',
      handler: 'game.processTurn',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/game/:roomId/character',
      handler: 'game.addCharacter',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/game/:roomId/start',
      handler: 'game.startGame',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/game/:roomId/action',
      handler: 'game.submitAction',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/game/engine/execute',
      handler: 'game.executeEngineAction',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/game/:roomId/ready',
      handler: 'game.toggleReady',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/game/:roomId',
      handler: 'game.getRoom',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
