export default {
  routes: [
    {
      method: 'POST',
      path: '/engine/spawn',
      handler: 'engine.spawn',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/engine/execute',
      handler: 'engine.execute',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
