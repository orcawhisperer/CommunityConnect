const express = require('express');
const userRoutes = require('./routes/userRoutes'); // Will be created later

const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies

// Routes
app.use('/api/v1/users', userRoutes); // User routes will be mounted here

// Basic Error Handling Middleware
// This should be defined after all other app.use() and routes calls
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    errors: err.errors || [], // For validation errors
  });
});

module.exports = app;
