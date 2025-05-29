import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // For initial check
  const navigate = useNavigate();

  useEffect(() => {
    // Check localStorage for token and user data on initial load
    const token = localStorage.getItem('connectSphereToken');
    const user = localStorage.getItem('connectSphereUser');
    if (token && user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('connectSphereToken');
        localStorage.removeItem('connectSphereUser');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('connectSphereToken', token);
    localStorage.setItem('connectSphereUser', JSON.stringify(userData));
    setCurrentUser(userData);
    navigate('/dashboard'); // Or wherever you want to redirect after login
  };

  const logout = () => {
    localStorage.removeItem('connectSphereToken');
    localStorage.removeItem('connectSphereUser');
    setCurrentUser(null);
    navigate('/login'); // Redirect to login page after logout
  };

  const updateUserInContext = (updatedUserData) => {
    setCurrentUser(updatedUserData);
    // Ensure token still exists before updating localStorage for user,
    // though in most update scenarios, user should be logged in.
    if (localStorage.getItem('connectSphereToken')) {
      localStorage.setItem('connectSphereUser', JSON.stringify(updatedUserData));
    } else {
      // This case would be unusual - updating user data without a token.
      // Decide if you need to handle this (e.g., by logging out, or re-fetching token/user)
      console.warn("updateUserInContext called but no token found in localStorage.");
    }
  };


  const value = {
    currentUser,
    login,
    logout,
    updateUserInContext, // Add the new function to the context value
    isAuthenticated: !!currentUser, // Helper to easily check if user is logged in
    loading // Expose loading state for initial auth check
  };

  // Don't render children until initial auth check is complete
  if (loading) {
    return <div>Loading application...</div>; // Or a spinner component
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
