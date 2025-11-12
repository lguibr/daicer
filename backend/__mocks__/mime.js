const getType = jest.fn(() => 'image/png');
const lookup = jest.fn(() => 'image/png');
const contentType = jest.fn((type) => type);
const charsets = {
  lookup: jest.fn(() => 'utf-8'),
};

module.exports = {
  getType,
  lookup,
  contentType,
  charsets,
  extensions: {},
  types: {},
};

