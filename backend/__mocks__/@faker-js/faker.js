const faker = {
  person: {
    firstName: jest.fn(() => 'Alex'),
    lastName: jest.fn(() => 'Storm'),
  },
  word: {
    adjective: jest.fn(() => 'shadow'),
    noun: jest.fn(() => 'blade'),
  },
};

module.exports = { faker };

