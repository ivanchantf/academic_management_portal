import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#1e293b', color: '#fff' }}>
      <div>
        <strong>Academics Management Portal</strong>
      </div>
      
      {user && (
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>Welcome, {user.name} ({user.role})</span>
          
          <Link to="/dashboard" style={{ color: '#fff' }}>Dashboard</Link>
          <Link to="/profile" style={{ color: '#fff' }}>My Profile</Link>
          
          <button onClick={() => { logout(); navigate('/login'); }}>
            Logout
          </button>
        </nav>
      )}
    </header>
  );
}