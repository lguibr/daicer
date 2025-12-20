export default [
  {
    method: 'POST',
    path: '/generate-chunk',
    handler: 'controller.generateChunk',
    config: {
      policies: [],
    },
  },
];
