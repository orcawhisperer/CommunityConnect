import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage'; // Import ProfilePage
import { useAuth } from './contexts/AuthContext';
import './App.css';

// ProtectedRoute component (already defined here)
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  const { isAuthenticated, logout, currentUser } = useAuth();

  return (
    <div>
      <nav>
        <ul>
          {isAuthenticated ? (
            <>
              <li>Welcome, {currentUser?.username}!</li>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/profile">Profile</Link></li> {/* Add Profile Link */}
              <li><button onClick={logout} style={{background: 'none', border: 'none', color: '#333', cursor: 'pointer', padding: 0, textDecoration: 'underline'}}>Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          )}
        </ul>
      </nav>
      <hr />
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegistrationPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile"  // Add Profile Route
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            isAuthenticated 
              ? <Navigate to="/dashboard" /> 
              : <div><h2>Home Page</h2><p>Welcome to ConnectSphere TimeBank. Please <Link to="/login">Login</Link> or <Link to="/register">Register</Link>.</p></div>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;
