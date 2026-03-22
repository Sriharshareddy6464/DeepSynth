import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Detect from './pages/Detect'

const PrivateRoute = ({ children }) => {
  return localStorage.getItem('token') 
    ? children 
    : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/detect" element={
          <PrivateRoute><Detect /></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
