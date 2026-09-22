// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';
import ProtectedLayout from './components/ProtectedLayout';
import RequireRole from './components/RequireRole';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProfileStaff from './components/ProfileStaff';
import ProfileStudent from './components/ProfileStudent';
import PasswordChange from './components/PasswordChange';
function AppRoutes() {
  const { user, loading } = useAuth();

  // 1. Wait until checkIdentity finished before rendering routes
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        <h3>Verifying session...</h3>
      </div>
    );
  }

  // 2. Render routes safely once user state is resolved
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes Wrapper */}
      <Route element={<ProtectedRoute user={user} />}>
        <Route element={<ProtectedLayout/>}>
        {/* both STAFF and STUDENT Route */}
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/password-change" element={<PasswordChange user={user} />} />
          {/* Staff-Only Route */}
          <Route element={<RequireRole user={user} allowedRole="Staff" />}>
            <Route path="/abc" element={<h1>This Page is for Staff Only</h1>} />
                 <Route path="/profile-staff" element={<ProfileStaff user={user} />} />
          </Route>

          {/* Student-Only Route */}
          <Route element={<RequireRole user={user} allowedRole="Student" />}>
            <Route path="/def" element={<h1>This page is for Student-Only</h1>} />
                <Route path="/profile-student" element={<ProfileStudent user={user} />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-All */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}