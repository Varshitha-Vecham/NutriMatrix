// Navbar - shows on Home page; has logo, links, profile, logout
import { useNavigate, NavLink, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiRequest } from '../api.js'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const [user, setUser] = useState({})

  useEffect(() => {
    apiRequest('/api/auth/me')
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch((requestError) => {
        if (requestError.message === 'Not authenticated.') navigate('/login')
      })
  }, [navigate])

  function handleLogout() {
    apiRequest('/api/auth/logout', { method: 'POST' }).finally(() => navigate('/login'))
  }

  const getNavClass = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`

  return (
    <nav className="navbar">
      <div className="nav-container">
        <NavLink to="/home" className="nav-logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-icon">🥗</span>
          <span className="logo-text">Nutri<span className="logo-accent">Matrix</span></span>
        </NavLink>

        <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>

        <ul className={menuOpen ? 'nav-menu active' : 'nav-menu'}>
          <li><NavLink to="/home" end className={getNavClass} onClick={() => setMenuOpen(false)}>Home</NavLink></li>
          <li><NavLink to="/about" className={getNavClass} onClick={() => setMenuOpen(false)}>About Us</NavLink></li>
          <li><NavLink to="/products" className={getNavClass} onClick={() => setMenuOpen(false)}>Product Analysis</NavLink></li>

          <li className="nav-profile">
            <NavLink to="/profile" className="profile-chip" onClick={() => setMenuOpen(false)}>
              <span className="profile-avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
              <span className="profile-name">{user.name || 'User'}</span>
            </NavLink>
          </li>

          <li>
            <button className="logout-btn" onClick={handleLogout}>
              <span>🚪</span> Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
