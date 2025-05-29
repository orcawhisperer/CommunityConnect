import React, { useState } from 'react';
import { registerUser } from '../services/authService'; // Import the auth service

function RegistrationPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(''); // For general API errors
  const [apiSuccess, setApiSuccess] = useState(''); // For success messages
  const [isLoading, setIsLoading] = useState(false); // For loading state

  const validateForm = () => {
    const newErrors = {};
    if (!username) newErrors.username = 'Username is required.';
    else if (!/^[a-zA-Z0-9]{5,20}$/.test(username)) {
      newErrors.username = 'Username must be 5-20 characters and alphanumeric.';
    }

    if (!email) newErrors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is not valid.';
    }

    if (!password) newErrors.password = 'Password is required.';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      newErrors.password = 'Password must include uppercase, lowercase, number, and special character.';
    }

    if (!confirmPassword) newErrors.confirmPassword = 'Confirm password is required.';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError(''); // Clear previous API errors
    setApiSuccess(''); // Clear previous success messages

    if (validateForm()) {
      setIsLoading(true);
      try {
        const userData = { username, email, password };
        const response = await registerUser(userData); // Call the service
        
        setApiSuccess(response.message || 'Registration successful! Please check your email to verify your account.');
        // Clear form fields
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setErrors({}); // Clear validation errors
      } catch (error) {
        // Handle errors from authService
        if (error.errors && error.errors.length > 0) {
          // Handle field-specific errors from backend
          const backendErrors = {};
          error.errors.forEach(err => {
            backendErrors[err.field || 'general'] = err.message;
          });
          setErrors(prevErrors => ({ ...prevErrors, ...backendErrors }));
          setApiError(error.message || 'Registration failed due to validation issues.');
        } else {
          setApiError(error.message || 'An unexpected error occurred during registration.');
        }
        console.error('Registration API error:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log('Client-side validation failed.');
    }
  };

  return (
    <div>
      <h1>Register for ConnectSphere</h1>
      <form onSubmit={handleSubmit}>
        {apiError && <p style={{ color: 'red', border: '1px solid red', padding: '10px' }}>{apiError}</p>}
        {apiSuccess && <p style={{ color: 'green', border: '1px solid green', padding: '10px' }}>{apiSuccess}</p>}
        
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
          />
          {errors.username && <p style={{ color: 'red' }}>{errors.username}</p>}
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          {errors.email && <p style={{ color: 'red' }}>{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          {errors.password && <p style={{ color: 'red' }}>{errors.password}</p>}
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
          {errors.confirmPassword && <p style={{ color: 'red' }}>{errors.confirmPassword}</p>}
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}

export default RegistrationPage;
