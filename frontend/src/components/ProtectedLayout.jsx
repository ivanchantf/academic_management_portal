// src/components/ProtectedLayout.jsx
import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

export default function ProtectedLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_PATH}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      navigate('/login');
    }
  };

  return (
    <div style={styles.layout}>
      {/* Top Navigation Bar */}
      <nav style={styles.navbar}>
        <div style={styles.logo}>My App</div>
        
        <div style={styles.navLinks}>
          <Link to="/dashboard" style={styles.link}>Dashboard</Link>
          <Link to="/profile" style={styles.link}>Profile</Link>
        </div>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </nav>

      {/* Main Page Content */}
      <main style={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  layout: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    color: '#fff',
    padding: '1rem 2rem',
  },
  logo: {
    fontWeight: 'bold',
    fontSize: '1.2rem',
  },
  navLinks: {
    display: 'flex',
    gap: '1.5rem',
  },
  link: {
    color: '#e2e8f0',
    textDecoration: 'none',
    fontWeight: '500',
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  content: {
    padding: '2rem',
    flex: 1,
  },
};