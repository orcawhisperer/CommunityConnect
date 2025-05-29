import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom'; // Import Router
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router> {/* Router needs to be an ancestor of AuthProvider if AuthProvider uses useNavigate */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </StrictMode>,
);
