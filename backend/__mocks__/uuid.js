const { randomUUID } = require('crypto');

const v4Impl = () => randomUUID();

module.exports = {
  v4: jest.fn(v4Impl),
};
