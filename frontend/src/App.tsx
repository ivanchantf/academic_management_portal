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
import Department from './components/Department';
import StudentEnrollment from './components/StudentEnrollment';
import CoursesProgramsManagement from './components/CoursesProgramsManagement';
import CreateNewAccount from './components/CreateNewAccount';
import CoursesCatalog from './components/CoursesCatalog';
import IssueTimeTickets from './components/IssueTimeTickets';
import SubmitRequests from './components/SubmitRequests';
import ProcessRequests from './components/ProcessRequests';
import RegisterCourses from './components/RegisterCourses';
import StaffList from './components/StaffList';
import ReleaseGrade from './components/ReleaseGrade';
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
          <Route path="/department/:did" element={<Department user={user} />} />
          <Route path="/courses-catalog" element={<CoursesCatalog user={user} />} />
          <Route path="/staff-list" element={<StaffList user={user} />} />
          
          {/* Staff-Only Route */}
          <Route element={<RequireRole user={user} allowedRole="Staff" />}>
           
            <Route path="/profile-staff" element={<ProfileStaff user={user} />} />
            <Route path="/student-enrollment" element={<StudentEnrollment user={user} />} />
            <Route path="/courses-programs-management" element={<CoursesProgramsManagement  user={user} />} />
            <Route path="account-creation" element={<CreateNewAccount user={user} />} />
            <Route path="/issue-time-tickets" element={<IssueTimeTickets user={user} />} />
            <Route path="/process-requests" element={<ProcessRequests user={user} />} />
            <Route path="/release-grade" element={<ReleaseGrade user={user} />} />
          </Route>

          {/* Student-Only Route */}
          <Route element={<RequireRole user={user} allowedRole="Student" />}>
            <Route path="/def" element={<h1>This page is for Student-Only</h1>} />
            <Route path="/profile-student" element={<ProfileStudent user={user} />} />
            <Route path="/submit-requests" element={<SubmitRequests user={user} />} />
            <Route path="/register-courses" element={<RegisterCourses />} />
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