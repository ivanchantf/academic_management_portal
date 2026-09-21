// src/components/RequireRole.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireRole({ allowedRole }) {
  const { user } = useAuth();

  if (user?.UserType !== allowedRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}