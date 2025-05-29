import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import DashboardPage from './pages/DashboardPage';
import { useAuth } from './contexts/AuthContext'; // Import useAuth
import './App.css';

// ProtectedRoute component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  const { isAuthenticated, logout, currentUser } = useAuth(); // Get auth state and functions

  return (
    <div>
      <nav>
        <ul>
          {isAuthenticated ? (
            <>
              <li>Welcome, {currentUser?.username}!</li>
              <li><Link to="/dashboard">Dashboard</Link></li>
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
