export default {
  routes: [
    {
      method: 'POST',
      path: '/voxel-engine/preview',
      handler: 'voxel-engine.voxelPreview',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
