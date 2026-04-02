import { createContext, useContext, useEffect, useState } from 'react';
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
} from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');

  const refreshSession = async ({ quiet = false } = {}) => {
    if (!quiet) {
      setStatus('loading');
    }

    try {
      const data = await getCurrentUser();

      if (data.authenticated && data.user) {
        setUser(data.user);
        setStatus('authenticated');
        setAuthError('');
        return data.user;
      }

      setUser(null);
      setStatus('guest');
      setAuthError('');
      return null;
    } catch (error) {
      setUser(null);
      setStatus('guest');
      setAuthError(error.message || 'Unable to verify session');
      return null;
    }
  };

  const login = async (email, password) => {
    setStatus('loading');
    setAuthError('');

    try {
      const data = await loginRequest(email, password);
      setUser(data.user || null);
      setStatus('authenticated');
      return data.user;
    } catch (error) {
      setUser(null);
      setStatus('guest');
      setAuthError(error.message || 'Login failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      setStatus('guest');
      setAuthError('');
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        authError,
        isAuthenticated: status === 'authenticated',
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
