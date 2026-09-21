import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './Page/Login';
import { useEffect } from 'react';
// Placeholder Pages
const Dashboard = () => <h2>Dashboard Overview</h2>;
const Profile = () => <h2>Update Own Profile</h2>;
const CourseRegistration = () => <h2>Student Course Registration</h2>;
const RequestApprovals = () => <h2>Staff Request Approvals</h2>;

const Unauthorized = () => <h2>UNAUTHORIZED</h2>;

export default function App() {
  useEffect(()=>{
    //check identitiy
  })


  return (
    <AuthProvider>
      <Router>
        {/* Single persistent Header across all views */}
        <Header />
        
        <main style={{ padding: '2rem' }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login/>} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Shared Authenticated Routes */}
            <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'STAFF']} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Student Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
              <Route path="/student/courses" element={<CourseRegistration />} />
              <Route path="/student/grades" element={<h2>Check Grades Released</h2>} />
              <Route path="/student/requests/mitigation" element={<h2>Submit Mitigation Request</h2>} />
              <Route path="/student/requests/credit-overload" element={<h2>Submit Credit Overload</h2>} />
              <Route path="/student/degree-progress" element={<h2>Degree Progress</h2>} />
            </Route>

            {/* Staff Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['STAFF']} />}>
              <Route path="/staff/grades" element={<h2>Assign / Update Grades</h2>} />
              <Route path="/staff/accounts" element={<h2>Create Accounts</h2>} />
              <Route path="/staff/students/:studentId/profile" element={<h2>Update Student Profile</h2>} />
              <Route path="/staff/time-tickets" element={<h2>Issue Registration Time Tickets</h2>} />
              <Route path="/staff/courses" element={<h2>Create / Update Courses</h2>} />
              <Route path="/staff/requests" element={<RequestApprovals />} />
            </Route>

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}