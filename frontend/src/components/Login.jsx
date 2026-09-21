import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import siteIcon from '../assets/siteIcon.png'; 
import loginBg from '../assets/login-bg.jpg'; // 1. Import your wallpaper here
import { checkIdentity } from '../utils/checkIdentity';

export default function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ username: 'tmchan', password: 'tmchan123!' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    checkIdentity().then((data) => {
      if (data?.user) {
        navigate('/dashboard');
        window.location.reload(); 
      }
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_PATH}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        navigate('/dashboard');
        window.location.reload(); 
      } else {
        setError(data.message || 'Invalid username or password.');
      }
    } catch (err) {
      setError('Failed to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.header}>
          <img src={siteIcon} alt="Site Icon" style={styles.icon} />
          <h2 style={styles.title}>Academic Management Portal</h2>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.inputGroup}>
          <label htmlFor="username" style={styles.label}>Username</label>
          <input
            id="username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="password" style={styles.label}>Password</label>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

const styles = {
container: {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  width: '100vw',
  // Adds a 40% black tint overlay on top of the background image
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4)), url(${loginBg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
},
  form: {
    width: '100%',
    maxWidth: '380px',
    padding: '2.5rem 2rem',
    borderRadius: '12px',
    // 3. Frosted glass effect for clean contrast against the wallpaper
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  title: {
    margin: 0,
    color: '#1a1a1a',
    fontSize: '1.35rem',
    textAlign: 'center',
  },
  icon: {
    width: '80px',
    height: '80px',
    objectFit: 'contain',
    borderRadius: '12px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  label: {
    fontSize: '0.9rem',
    color: '#333',
    fontWeight: '500',
  },
  input: {
    padding: '0.65rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    outline: 'none',
  },
  button: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#0070f3',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'background-color 0.2s ease',
  },
  error: {
    color: '#d32f2f',
    fontSize: '0.875rem',
    textAlign: 'center',
  },
};