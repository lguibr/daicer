export default {
  routes: [
    {
      method: 'POST',
      path: '/rooms/:id/join',
      handler: 'room.join',
    },
    {
      method: 'POST',
      path: '/rooms/:id/action',
      handler: 'room.submitAction',
    },
    {
      method: 'POST',
      path: '/rooms/:id/turn',
      handler: 'room.triggerTurn',
    },
  ],
};
