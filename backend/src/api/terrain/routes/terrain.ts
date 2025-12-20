export default {
  routes: [
    {
      method: 'POST',
      path: '/terrain/chunk',
      handler: 'terrain.chunk',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/terrain/generate',
      handler: 'terrain.generate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
