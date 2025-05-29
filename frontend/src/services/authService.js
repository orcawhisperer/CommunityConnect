import axios from 'axios';

// Define the base URL for the backend API.
// In a real application, this would likely come from an environment variable.
const API_BASE_URL = 'http://localhost:3001/api/v1'; // Assuming backend runs on port 3001

/**
 * Registers a new user.
 * @param {object} userData - User data including username, email, and password.
 * @returns {Promise<object>} - The response data from the API.
 * @throws {Error} - Throws an error if the API request fails.
 */
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/register`, userData);
    return response.data; // Return the data from the response (e.g., success message, user object)
  } catch (error) {
    // Axios wraps the error response in error.response
    if (error.response && error.response.data) {
      // If the backend sends specific error messages, re-throw them or an error object containing them
      throw { 
        message: error.response.data.message || 'Registration failed. Please try again.',
        errors: error.response.data.errors || [], // For field-specific errors
        status: error.response.status
      };
    } else if (error.request) {
      // The request was made but no response was received (e.g., network error)
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }
};

/**
 * Logs in an existing user.
 * @param {object} credentials - User credentials including loginIdentifier and password.
 * @returns {Promise<object>} - The response data from the API (includes token and user info).
 * @throws {Error} - Throws an error if the API request fails.
 */
export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/login`, credentials);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw {
        message: error.response.data.message || 'Login failed. Please try again.',
        errorCode: error.response.data.errorCode, // For specific error codes like EMAIL_NOT_VERIFIED
        status: error.response.status
      };
    } else if (error.request) {
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      throw new Error('An unexpected error occurred during login. Please try again.');
    }
  }
};
