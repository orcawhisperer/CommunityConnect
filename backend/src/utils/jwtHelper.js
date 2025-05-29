const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../../.env' }); // Adjust path to point to backend/.env

/**
 * Generates a JWT for a given user.
 * @param {object} user - User object containing user_id, username, and email.
 * @returns {string} - The generated JWT.
 */
const generateToken = (user) => {
  const payload = {
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    // Add other claims as needed, e.g., roles
  };

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in the environment variables.');
  }
  if (!process.env.JWT_EXPIRES_IN) {
    throw new Error('JWT_EXPIRES_IN is not defined in the environment variables.');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

module.exports = {
  generateToken,
};
