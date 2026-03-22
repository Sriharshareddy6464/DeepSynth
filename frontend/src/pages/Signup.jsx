import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api/auth';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const getStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getStrength(password);
  const strengthColor = strength === 0 ? 'transparent' : strength === 1 ? 'var(--fake)' : strength === 2 ? '#fbbf24' : 'var(--accent)';
  const strengthWidth = strength === 0 ? '0%' : strength === 1 ? '33%' : strength === 2 ? '66%' : '100%';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');
    try {
      const data = await signup(username, email, password);
      if (data.success) {
        navigate('/login');
      } else {
        setError(data.error || 'Error creating account');
      }
    } catch (err) {
      setError('Network error — is the server running?');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'var(--bg-card)', padding: '3.5rem 2.5rem', borderRadius: '16px', width: '100%', maxWidth: '420px', margin: '0', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}>
        <h2 style={{ color: 'white', textAlign: 'center', fontSize: '1.8rem', marginBottom: '2.5rem', fontWeight: 'bold' }}>Create Account</h2>
        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--fake)', color: 'var(--fake)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Username</p>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.1rem' }}>👤</span>
              <input type="text" placeholder="Choose a username" value={username} onChange={e => setUsername(e.target.value)} required
                style={{ width: '100%', padding: '1rem 1rem 1rem 2.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }} />
            </div>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Email</p>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.1rem' }}>✉</span>
              <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: '100%', padding: '1rem 1rem 1rem 2.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }} />
            </div>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Password</p>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.1rem' }}>🔒</span>
              <input type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: '100%', padding: '1rem 2.5rem 1rem 2.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>👁</button>
            </div>
            <div style={{ marginTop: '0.8rem' }}>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: strengthWidth, background: strengthColor, transition: 'all 0.3s' }}></div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.4rem' }}>Password strength</p>
            </div>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Confirm Password</p>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.1rem' }}>🔒</span>
              <input type={showConfirm ? 'text' : 'password'} placeholder="Confirm your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                style={{ width: '100%', padding: '1rem 2.5rem 1rem 2.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>👁</button>
            </div>
          </div>
          <button type="submit" style={{ background: 'var(--accent)', color: 'var(--bg-primary)', padding: '1.1rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem', transition: 'background 0.3s' }}>
            Sign Up
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
