export const login = async (email, password) => {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  })
  const data = await res.json()
  if (data.success) {
    localStorage.setItem('token', 'logged_in')
    localStorage.setItem('username', data.username)
  }
  return data
}

export const signup = async (username, email, password) => {
  const res = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, email, password })
  })
  return res.json()
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  fetch('/api/logout', { credentials: 'include' })
}

export const isLoggedIn = () => {
  return !!localStorage.getItem('token')
}
