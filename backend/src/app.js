const express = require('express');
const userRoutes = require('./routes/userRoutes'); // This now imports an object { router, ... }

const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies

// Routes
// Ensure we are using the router object from the userRoutes module
app.use('/api/v1/users', userRoutes.router); 

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
