const getType = jest.fn(() => 'image/png');
const define = jest.fn();

const lookup = jest.fn(() => 'application/json');
const charsets = {
  lookup: jest.fn(() => 'utf-8'),
};
const contentType = jest.fn((type) => type);

module.exports = {
  getType,
  lookup,
  contentType,
  define,
  types: {},
  extensions: {},
  charsets,
};

