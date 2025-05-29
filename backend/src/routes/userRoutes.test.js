const {
  registerUserHandler,
  loginUserHandler,
  // Import validation rules if you want to test them separately or use them to build requests
  // registrationValidationRules,
  // loginValidationRules
} = require('./userRoutes'); // Import the handlers
const db = require('../db'); // Will be the mocked version from __mocks__/db.js
const bcrypt = require('bcrypt'); // Will be the mocked version from __mocks__/bcrypt.js
const crypto = require('crypto');
const { generateToken } = require('../utils/jwtHelper');
const { validationResult } = require('express-validator');

// Mock external dependencies
jest.mock('bcrypt'); // Already mocked via backend/__mocks__/bcrypt.js
jest.mock('crypto');
jest.mock('../db'); // Ensures we use the mock from src/__mocks__/db.js
jest.mock('../utils/jwtHelper');
jest.mock('express-validator');


// Helper to create mock req, res, next objects
const mockRequest = (body = {}, params = {}, query = {}, session = {}) => ({
  body,
  params,
  query,
  session,
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('User Route Handlers', () => {
  let consoleErrorSpy;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });
  
  beforeEach(() => {
    // Reset mocks before each test
    db.resetAllMocks(); // From src/__mocks__/db.js
    bcrypt.hash.mockClear(); // Use .mockClear() for mocks from jest.createMockFromModule
    bcrypt.compare.mockClear();
    crypto.randomBytes.mockReset();
    generateToken.mockReset();
    validationResult.mockReset();
    mockNext.mockClear();
  });

  // --- Registration Handler Tests ---
  describe('registerUserHandler', () => {
    const validUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should register a new user successfully', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      db.query.mockResolvedValueOnce({ rows: [] }); // No existing user
      bcrypt.hash.mockResolvedValueOnce('hashedpassword123');
      crypto.randomBytes.mockReturnValueOnce(Buffer.from('randomtokenbytes'));
      db.query.mockResolvedValueOnce({ // DB insert success
        rows: [{
          user_id: 1,
          username: validUserData.username,
          email: validUserData.email,
          status: 'pending_verification',
        }],
      });

      const req = mockRequest(validUserData);
      const res = mockResponse();

      await registerUserHandler(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'User registered successfully. Please check your email to verify your account.',
        user: expect.objectContaining({ username: validUserData.username }),
      }));
      expect(bcrypt.hash).toHaveBeenCalledWith(validUserData.password, 10);
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('should return 400 if validation errors exist', async () => {
      const errors = [{ msg: 'Validation error' }];
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });
      
      const req = mockRequest(validUserData);
      const res = mockResponse();

      await registerUserHandler(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, errors });
    });

    it('should return 409 if username already exists', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      db.query.mockResolvedValueOnce({ rows: [{ username: 'testuser', email: 'other@example.com' }] });

      const req = mockRequest(validUserData);
      const res = mockResponse();

      await registerUserHandler(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        errors: expect.arrayContaining([expect.objectContaining({ field: 'username' })]),
      }));
    });
    
    it('should return 409 if email already exists', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      db.query.mockResolvedValueOnce({ rows: [{ username: 'anotheruser', email: 'test@example.com' }] });

      const req = mockRequest(validUserData);
      const res = mockResponse();

      await registerUserHandler(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        errors: expect.arrayContaining([expect.objectContaining({ field: 'email' })]),
      }));
    });

    it('should call next with error if database query fails', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      db.query.mockRejectedValueOnce(new Error('DB error'));

      const req = mockRequest(validUserData);
      const res = mockResponse();

      await registerUserHandler(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].message).toBe('DB error'); // Check the error message
    });
  });

  // --- Login Handler Tests ---
  describe('loginUserHandler', () => {
    const loginCredentials = {
      loginIdentifier: 'testuser',
      password: 'Password123!',
    };
    const mockUser = {
      user_id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashedpassword123', // Real hash not needed due to bcrypt mock
      is_email_verified: true,
      status: 'active',
    };

    it('should login a user successfully', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      db.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(true); // Password matches
      generateToken.mockReturnValueOnce('mocked.jwt.token');

      const req = mockRequest(loginCredentials);
      const res = mockResponse();

      await loginUserHandler(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        token: 'mocked.jwt.token',
        user: expect.objectContaining({ username: mockUser.username }),
      }));
      expect(bcrypt.compare).toHaveBeenCalledWith(loginCredentials.password, mockUser.password_hash);
      expect(generateToken).toHaveBeenCalledWith(expect.objectContaining({ user_id: mockUser.user_id }));
    });

    it('should return 400 if validation errors exist for login', async () => {
      const errors = [{ msg: 'Login validation error' }];
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });
      
      const req = mockRequest(loginCredentials);
      const res = mockResponse();

      await loginUserHandler(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, errors });
    });
    
    it('should return 401 if user not found', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      db.query.mockResolvedValueOnce({ rows: [] }); // No user found

      const req = mockRequest(loginCredentials);
      const res = mockResponse();

      await loginUserHandler(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid credentials.' }));
    });

    it('should return 401 for incorrect password', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      db.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(false); // Password does not match

      const req = mockRequest(loginCredentials);
      const res = mockResponse();

      await loginUserHandler(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid credentials.' }));
    });

    it('should return 403 if email not verified and status is pending_verification', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      const unverifiedUser = { ...mockUser, is_email_verified: false, status: 'pending_verification' };
      db.query.mockResolvedValueOnce({ rows: [unverifiedUser] });
      bcrypt.compare.mockResolvedValueOnce(true);

      const req = mockRequest(loginCredentials);
      const res = mockResponse();

      await loginUserHandler(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'EMAIL_NOT_VERIFIED' }));
    });

    it('should return 403 if account is suspended', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      const suspendedUser = { ...mockUser, status: 'suspended' };
      db.query.mockResolvedValueOnce({ rows: [suspendedUser] });
      bcrypt.compare.mockResolvedValueOnce(true);

      const req = mockRequest(loginCredentials);
      const res = mockResponse();

      await loginUserHandler(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'ACCOUNT_SUSPENDED' }));
    });
    
    it('should call next with error if database query fails during login', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      db.query.mockRejectedValueOnce(new Error('DB error during login'));

      const req = mockRequest(loginCredentials);
      const res = mockResponse();

      await loginUserHandler(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].message).toBe('DB error during login');
    });
  });
});
