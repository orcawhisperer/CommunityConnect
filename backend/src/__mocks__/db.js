// Mock implementation for the db module
const mockQuery = jest.fn();

const pool = {
  query: mockQuery,
  connect: jest.fn(),
  on: jest.fn(),
};

module.exports = {
  query: mockQuery,
  pool,
  // Helper to reset the mock before each test or when needed
  __esModule: true, // This is important for Jest to correctly mock ES6 modules
  default: {
    query: mockQuery,
    pool,
  },
  // Add a way to reset all mocks for convenience
  resetAllMocks: () => {
    mockQuery.mockReset();
    pool.connect.mockReset();
    pool.on.mockReset();
  },
  // Add a way to set a custom implementation for a test
  setMockQueryImplementation: (fn) => {
    mockQuery.mockImplementation(fn);
  }
};
