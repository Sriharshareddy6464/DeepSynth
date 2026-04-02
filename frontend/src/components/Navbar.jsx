import { Link, useNavigate } from 'react-router-dom';
import bdlLogo from '../assets/bdl-logo.png';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav
      style={{
        background: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        width: '100%',
        position: 'fixed',
        top: 0,
        height: '90px',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 2rem',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <img src={bdlLogo} alt="BDL Logo" style={{ height: '85px', objectFit: 'contain' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
        <Link to="/" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.95rem' }}>
          About
        </Link>
        <Link to="/" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.95rem' }}>
          Contact
        </Link>
        {isAuthenticated ? (
          <>
            <Link to="/detect" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.95rem' }}>
              Detect
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.95rem' }}>
              Login
            </Link>
            <Link
              to="/signup"
              style={{
                background: 'var(--accent)',
                color: 'var(--bg-primary)',
                padding: '0.6rem 1.5rem',
                borderRadius: '9999px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'background 0.3s',
              }}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
