// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { checkIdentity } from '../utils/checkIdentity';

export default function ProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    checkIdentity()
      .then((data) => {
        if (isMounted) {
          setIsAuthenticated(data?.success || false);
        }
      })
      .catch(() => {
        if (isMounted) setIsAuthenticated(false);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Show a loader while verifying session
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}