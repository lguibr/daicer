export default {
  routes: [
    {
      method: 'POST',
      path: '/voxel-engine/preview',
      handler: 'voxel-engine.previewWorld',
      config: {
        auth: false,
      },
    },
  ],
};
