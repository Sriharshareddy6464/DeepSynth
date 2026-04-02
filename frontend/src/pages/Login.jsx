import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  const notice = location.state?.message || '';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/detect', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/detect', { replace: true });
    } catch (err) {
      setError(err.message || 'Network error. Is the server running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          padding: '3.5rem 2.5rem',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '420px',
          margin: '20px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }}
      >
        <h2
          style={{
            color: 'white',
            textAlign: 'center',
            fontSize: '1.8rem',
            marginBottom: '2.5rem',
            fontWeight: 'bold',
          }}
        >
          Welcome Back
        </h2>
        {notice && (
          <div
            style={{
              background: 'rgba(100, 255, 218, 0.12)',
              border: '1px solid rgba(100, 255, 218, 0.35)',
              color: 'var(--accent)',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}
          >
            {notice}
          </div>
        )}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--fake)',
              color: 'var(--fake)',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Email</p>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={{
                width: '100%',
                padding: '1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'white',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Password</p>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              style={{
                width: '100%',
                padding: '1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'white',
                outline: 'none',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: isSubmitting ? '#334155' : 'var(--accent)',
              color: isSubmitting ? '#94a3b8' : 'var(--bg-primary)',
              padding: '1.1rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
              transition: 'background 0.3s',
            }}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
