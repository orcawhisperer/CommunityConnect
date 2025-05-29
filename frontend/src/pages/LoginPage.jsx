import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService'; // Import the auth service
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

function LoginPage() {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(''); // For general API errors
  const [isLoading, setIsLoading] = useState(false); // For loading state

  const navigate = useNavigate();
  const { login } = useAuth(); // Get the login function from AuthContext

  const validateForm = () => {
    const newErrors = {};
    if (!loginIdentifier) newErrors.loginIdentifier = 'Username or Email is required.';
    if (!password) newErrors.password = 'Password is required.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError(''); // Clear previous API errors

    if (validateForm()) {
      setIsLoading(true);
      try {
        const credentials = { loginIdentifier, password };
        const response = await loginUser(credentials); // Call the service
        
        // Use the login function from AuthContext
        login(response.user, response.token);
        // Redirection is handled by the login function in AuthContext

        // Clear form fields
        setLoginIdentifier('');
        setPassword('');
        setErrors({});
        
      } catch (error) {
        // Handle errors from authService
        setApiError(error.message || 'An unexpected error occurred during login.');
        console.error('Login API error:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log('Client-side validation failed for login.');
    }
  };

  return (
    <div>
      <h1>Login to ConnectSphere</h1>
      <form onSubmit={handleSubmit}>
        {apiError && <p style={{ color: 'red', border: '1px solid red', padding: '10px' }}>{apiError}</p>}
        
        <div>
          <label htmlFor="loginIdentifier">Username or Email:</label>
          <input
            type="text"
            id="loginIdentifier"
            name="loginIdentifier"
            value={loginIdentifier}
            onChange={(e) => setLoginIdentifier(e.target.value)}
            disabled={isLoading}
          />
          {errors.loginIdentifier && <p style={{ color: 'red' }}>{errors.loginIdentifier}</p>}
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
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
