const expressValidator = jest.createMockFromModule('express-validator');

// Mock validationResult
// It should return an object with an isEmpty method and an array method.
// By default, simulate no errors.
let mockErrors = [];
expressValidator.validationResult = jest.fn(() => ({
  isEmpty: () => mockErrors.length === 0,
  array: () => mockErrors,
}));

// Helper to set mock errors for a test
expressValidator.__setMockErrors = (errors = []) => {
  mockErrors = errors;
};

// Mock body and other validators if needed, though for handler testing,
// we primarily care about controlling validationResult.
// For now, make them return a dummy object or chainable function.
const chainable = () => new Proxy({}, { get: () => chainable });
expressValidator.body = jest.fn(() => chainable());
expressValidator.param = jest.fn(() => chainable());
expressValidator.query = jest.fn(() => chainable());
// Add any other validators you use

module.exports = expressValidator;
