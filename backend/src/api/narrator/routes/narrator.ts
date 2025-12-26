export default {
  routes: [
    {
      method: 'POST',
      path: '/narrator/action',
      handler: 'narrator.handleAction',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
