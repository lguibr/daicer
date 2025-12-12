export default {
  routes: [
    {
      method: 'POST',
      path: '/assets/avatar/preview/portrait',
      handler: 'assets.generatePortrait',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/assets/avatar/preview/upper',
      handler: 'assets.generateUpperBody',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/assets/avatar/preview/full',
      handler: 'assets.generateFullBody',
      config: {
        auth: false,
      },
    },
  ],
};
