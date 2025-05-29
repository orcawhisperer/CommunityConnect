const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');
const { body, validationResult } = require('express-validator');
const { generateToken } = require('../utils/jwtHelper');

const router = express.Router();

// --- Validation Rules ---
const registrationValidationRules = [
  body('username')
    .isString()
    .isLength({ min: 5, max: 20 }).withMessage('Username must be between 5 and 20 characters')
    .isAlphanumeric().withMessage('Username must be alphanumeric'),
  body('email')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];

const loginValidationRules = [
  body('loginIdentifier')
    .isString().withMessage('Login identifier must be a string')
    .notEmpty().withMessage('Login identifier is required'),
  body('password')
    .isString().withMessage('Password must be a string')
    .notEmpty().withMessage('Password is required'),
];

// --- Route Handlers ---
const registerUserHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    const existingUser = await db.query(
      'SELECT * FROM Users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      const conflictingFields = [];
      if (existingUser.rows.some(user => user.username === username)) {
        conflictingFields.push({ field: 'username', message: 'Username already exists.' });
      }
      if (existingUser.rows.some(user => user.email === email)) {
        conflictingFields.push({ field: 'email', message: 'Email already exists.' });
      }
      return res.status(409).json({ success: false, message: 'User already exists.', errors: conflictingFields });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUserResult = await db.query(
      `INSERT INTO Users (username, email, password_hash, email_verification_token, email_verification_expires_at, status)
       VALUES ($1, $2, $3, $4, $5, 'pending_verification')
       RETURNING user_id, username, email, status, created_at, updated_at`,
      [username, email, passwordHash, emailVerificationToken, emailVerificationExpiresAt]
    );

    const newUser = newUserResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        user_id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        status: newUser.status,
      },
    });
  } catch (error) {
    if (!error.status) {
        error.status = 500;
    }
    next(error);
  }
};

const loginUserHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { loginIdentifier, password } = req.body;

  try {
    const userResult = await db.query(
      'SELECT * FROM Users WHERE username = $1 OR email = $1',
      [loginIdentifier]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = userResult.rows[0];
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.status === 'pending_verification' && !user.is_email_verified) {
        return res.status(403).json({
            success: false,
            message: 'Email not verified. Please verify your email before logging in.',
            errorCode: 'EMAIL_NOT_VERIFIED'
        });
    }
    if (['suspended', 'banned', 'deactivated'].includes(user.status)) {
        return res.status(403).json({
            success: false,
            message: `Account is ${user.status}. Please contact support.`,
            errorCode: `ACCOUNT_${user.status.toUpperCase()}`
        });
    }

    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token: token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        status: user.status,
        is_email_verified: user.is_email_verified
      },
    });
  } catch (error) {
    if (!error.status) {
        error.status = 500;
    }
    next(error);
  }
};

// --- Router Setup ---
router.post('/register', registrationValidationRules, registerUserHandler);
router.post('/login', loginValidationRules, loginUserHandler);

module.exports = {
  router, // Export router for app.js
  registerUserHandler, // Export handler for testing
  loginUserHandler, // Export handler for testing
  registrationValidationRules, // Export rules if needed for more complex test setups
  loginValidationRules
};
