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
