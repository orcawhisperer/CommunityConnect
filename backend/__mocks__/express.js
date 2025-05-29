const express = jest.createMockFromModule('express');

// Mock the Router
const mockRouter = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  use: jest.fn(),
  // Add any other router methods your application uses
};

express.Router = jest.fn(() => mockRouter);

// Mock other express functionalities if needed by your tests or the code being tested
express.json = jest.fn(() => (req, res, next) => next()); // Mock middleware
express.urlencoded = jest.fn(() => (req, res, next) => next()); // Mock middleware

// If your app.js or other files use express() directly:
const mockApp = {
  use: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  listen: jest.fn((port, cb) => { if(cb) cb(); return mockApp; }), // Mock listen
  // Add other app methods if needed
};
const expressInstance = jest.fn(() => mockApp);
// Allow both `express()` and `express.static`, etc.
Object.assign(expressInstance, express); 

module.exports = expressInstance;
