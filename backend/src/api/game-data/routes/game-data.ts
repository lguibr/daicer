export default {
  routes: [
    {
      method: 'GET',
      path: '/game-data/character-templates/:archetype',
      handler: 'game-data.getTemplate',
      config: {
        auth: false,
      },
    },
  ],
};
