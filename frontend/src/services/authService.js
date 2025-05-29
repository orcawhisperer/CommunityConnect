import axios from 'axios';

// Define the base URL for the backend API.
// In a real application, this would likely come from an environment variable.
const API_BASE_URL = 'http://localhost:3001/api/v1'; // Assuming backend runs on port 3001

const getAuthHeaders = () => {
  const token = localStorage.getItem('connectSphereToken');
  if (!token) {
    // This case should ideally be handled before calling API functions that need auth,
    // but as a safeguard:
    throw new Error('No authentication token found.');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json', // Default content type
  };
};

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

/**
 * Fetches the authenticated user's profile.
 * @returns {Promise<object>} - The user profile data from the API.
 * @throws {Error} - Throws an error if the API request fails or no token is found.
 */
export const getProfile = async () => {
  try {
    const headers = getAuthHeaders(); // Throws error if no token
    const response = await axios.get(`${API_BASE_URL}/users/profile`, { headers });
    // Assuming the backend returns { success: true, user: { ... } }
    if (response.data && response.data.success && response.data.user) {
      return response.data.user;
    } else {
      // Handle cases where backend response structure is not as expected
      throw new Error('Invalid profile data received from server.');
    }
  } catch (error) {
    if (error.message === 'No authentication token found.') { // Re-throw specific error
        throw error;
    }
    if (error.response && error.response.data) {
      throw {
        message: error.response.data.message || 'Failed to fetch profile.',
        status: error.response.status
      };
    } else if (error.request) {
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      throw new Error('An unexpected error occurred while fetching profile. Please try again.');
    }
  }
};

/**
 * Updates the authenticated user's profile.
 * @param {object} profileDataToUpdate - The profile data to update.
 * @returns {Promise<object>} - The API response (expected to include the updated user profile).
 * @throws {Error} - Throws an error if the API request fails.
 */
export const updateProfile = async (profileDataToUpdate) => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.put(`${API_BASE_URL}/users/profile`, profileDataToUpdate, { headers });
    // Backend is expected to return { success: true, message: "...", user: { ... } }
    if (response.data && response.data.success && response.data.user) {
      return response.data; // Contains success message and updated user object
    } else {
      throw new Error('Invalid response data received from server after update.');
    }
  } catch (error) {
    if (error.message === 'No authentication token found.') {
        throw error;
    }
    if (error.response && error.response.data) {
      // Backend might send specific field errors or general messages
      throw {
        message: error.response.data.message || 'Failed to update profile.',
        errors: error.response.data.errors || [], // For field-specific validation errors from backend
        status: error.response.status
      };
    } else if (error.request) {
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      throw new Error('An unexpected error occurred while updating profile. Please try again.');
    }
  }
};
