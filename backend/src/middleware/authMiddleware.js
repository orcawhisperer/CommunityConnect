const jwt = require('jsonwebtoken');
const db = require('../db'); // To potentially fetch fresh user data, though not strictly needed if payload is sufficient
require('dotenv').config({ path: '../../.env' }); // Adjust path to point to backend/.env

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined in environment variables.');
        return res.status(500).json({ success: false, message: 'Server configuration error.' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request object
      // We can choose to either trust the decoded payload or fetch fresh user data
      // For this implementation, we'll trust the decoded payload for efficiency,
      // but ensure it contains essential, non-sensitive identifiers like user_id.
      // If sensitive or frequently changing data is needed, a DB query would be better.
      req.user = {
        user_id: decoded.user_id,
        username: decoded.username,
        email: decoded.email
        // Add other fields from JWT payload if they were included during token generation
      };

      // Optional: Fetch fresh user from DB if more/updated details are needed beyond JWT payload
      // const currentUser = await db.query('SELECT user_id, username, email, status FROM Users WHERE user_id = $1', [decoded.user_id]);
      // if (currentUser.rows.length === 0) {
      //   return res.status(401).json({ success: false, message: 'User not found.' });
      // }
      // req.user = currentUser.rows[0]; // Overwrite with fresh data

      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Not authorized, token failed.' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Not authorized, token expired.' });
      }
      return res.status(401).json({ success: false, message: 'Not authorized, general token error.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
  }
};

module.exports = { protect };
