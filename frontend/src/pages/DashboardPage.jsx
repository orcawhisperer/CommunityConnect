import React from 'react';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

function DashboardPage() {
  const { currentUser, logout } = useAuth(); // Get user and logout from context

  if (!currentUser) {
    // This case should ideally be handled by ProtectedRoute, but as a fallback:
    return <p>Loading user data or not logged in...</p>;
  }

  return (
    <div>
      <h1>Welcome to ConnectSphere, {currentUser.username}!</h1>
      <p>This is your dashboard.</p>
      <p>Email: {currentUser.email}</p>
      <p>Status: {currentUser.status}</p>
      <p>Email Verified: {currentUser.is_email_verified ? 'Yes' : 'No'}</p>
      {/* Add more dashboard content here as needed */}
      <button onClick={logout} style={{ marginTop: '20px' }}>Logout</button>
    </div>
  );
}

export default DashboardPage;
