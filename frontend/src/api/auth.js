import { apiRequest } from './client';

export const login = (email, password) =>
  apiRequest('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const register = (username, email, password) =>
  apiRequest('/api/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });

export const logout = () =>
  apiRequest('/api/logout', {
    method: 'POST',
  });

export const getCurrentUser = () =>
  apiRequest('/api/me', {
    method: 'GET',
  });
