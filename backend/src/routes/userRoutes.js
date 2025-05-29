const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');
const { body, validationResult } = require('express-validator');
const { generateToken } = require('../utils/jwtHelper');
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware

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

const updateProfileValidationRules = [
    body('first_name').optional().isString().isLength({ max: 50 }).withMessage('First name must be a string and max 50 characters.')
        .matches(/^[A-Za-z\s]+$/).withMessage('First name must only contain alphabetic characters and spaces.'),
    body('last_name').optional().isString().isLength({ max: 50 }).withMessage('Last name must be a string and max 50 characters.')
        .matches(/^[A-Za-z\s]+$/).withMessage('Last name must only contain alphabetic characters and spaces.'),
    body('bio').optional().isString().isLength({ max: 500 }).withMessage('Bio must be a string and max 500 characters.'),
    body('city').optional().isString().isLength({ max: 100 }).withMessage('City must be a string and max 100 characters.'),
    body('pincode').optional().isString().isLength({ min:6, max: 6 }).withMessage('Pincode must be 6 digits.')
        .isNumeric().withMessage('Pincode must be numeric.'),
    body('general_availability').optional().isString().isLength({ max: 255 }).withMessage('General availability must be a string and max 255 characters.'),
    // Custom validation to ensure at least one field is present
    body().custom((value, { req }) => {
        const { first_name, last_name, bio, city, pincode, general_availability } = req.body;
        if (!first_name && !last_name && !bio && !city && !pincode && !general_availability) {
            throw new Error('At least one field must be provided for update.');
        }
        return true;
    }),
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

const getUserProfileHandler = async (req, res, next) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ success: false, message: 'Not authorized, user ID missing.' });
    }
    const userId = req.user.user_id;
    const query = `
      SELECT 
        user_id, username, email, first_name, last_name, 
        profile_picture_url, bio, city, pincode, 
        general_availability, sphere_credit_balance, 
        avg_rating, total_reviews_received, status, created_at, updated_at
      FROM Users 
      WHERE user_id = $1
    `;
    const { rows } = await db.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, user: rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    if (!error.status) {
        error.status = 500;
    }
    next(error);
  }
};

const updateUserProfileHandler = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user.user_id;
    const { first_name, last_name, bio, city, pincode, general_availability } = req.body;

    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;

    if (first_name !== undefined) {
        updateFields.push(`first_name = $${paramIndex++}`);
        queryParams.push(first_name);
    }
    if (last_name !== undefined) {
        updateFields.push(`last_name = $${paramIndex++}`);
        queryParams.push(last_name);
    }
    if (bio !== undefined) {
        updateFields.push(`bio = $${paramIndex++}`);
        queryParams.push(bio);
    }
    if (city !== undefined) {
        updateFields.push(`city = $${paramIndex++}`);
        queryParams.push(city);
    }
    if (pincode !== undefined) {
        updateFields.push(`pincode = $${paramIndex++}`);
        queryParams.push(pincode);
    }
    if (general_availability !== undefined) {
        updateFields.push(`general_availability = $${paramIndex++}`);
        queryParams.push(general_availability);
    }

    // This check is technically also covered by the custom validator, but good for safety
    if (updateFields.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields provided for update.' });
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    queryParams.push(userId); // For the WHERE clause

    const updateQuery = `
        UPDATE Users 
        SET ${updateFields.join(', ')} 
        WHERE user_id = $${paramIndex}
        RETURNING user_id, username, email, first_name, last_name, 
                  profile_picture_url, bio, city, pincode, 
                  general_availability, sphere_credit_balance, 
                  avg_rating, total_reviews_received, status, created_at, updated_at;
    `;

    try {
        const { rows } = await db.query(updateQuery, queryParams);
        if (rows.length === 0) {
            // Should not happen if user_id from token is valid
            return res.status(404).json({ success: false, message: 'User not found after update attempt.' });
        }
        res.status(200).json({ success: true, message: 'Profile updated successfully.', user: rows[0] });
    } catch (error) {
        console.error('Update profile error:', error);
        if (!error.status) {
            error.status = 500;
        }
        next(error);
    }
};


// --- Router Setup ---
router.post('/register', registrationValidationRules, registerUserHandler);
router.post('/login', loginValidationRules, loginUserHandler);
router.get('/profile', protect, getUserProfileHandler);
router.put('/profile', protect, updateProfileValidationRules, updateUserProfileHandler); // Add the new protected PUT route


module.exports = {
  router, // Export router for app.js
  registerUserHandler, 
  loginUserHandler, 
  getUserProfileHandler, 
  updateUserProfileHandler, // Export handler for testing
  registrationValidationRules, 
  loginValidationRules,
  updateProfileValidationRules // Export rules for testing
};
