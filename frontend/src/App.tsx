// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import ProtectedLayout from './components/ProtectedLayout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';

export default function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  return (
    <BrowserRouter >
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={<Login onLoginSuccess={handleLoginSuccess} />}
        />
        

        {/* Protected Routes Wrapper */}
        <Route element={<ProtectedRoute />}>
          {/* Shared Layout with Top Navbar */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
          </Route>
        </Route>

        {/* Fallback / Catch-All Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}