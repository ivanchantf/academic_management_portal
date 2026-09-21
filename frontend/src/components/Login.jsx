import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import siteIcon from '../assets/siteIcon.png'; // Adjust extension (.svg, .png, etc.) and relative path if needed

export default function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
        if (onLoginSuccess) onLoginSuccess(data);
        navigate('/dashboard');
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
          <h2>Login</h2>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.inputGroup}>
          <label htmlFor="username">Username</label>
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
          <label htmlFor="password">Password</label>
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
    minHeight: '60vh',
  },
  form: {
    width: '100%',
    maxWidth: '360px',
    padding: '2rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  icon: {
    width: '200px',
    height: '200px',
    objectFit: 'contain',
    borderRadius: '20%',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  input: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  button: {
    padding: '0.75rem',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#0070f3',
    color: '#fff',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  error: {
    color: '#d32f2f',
    fontSize: '0.875rem',
  },
};