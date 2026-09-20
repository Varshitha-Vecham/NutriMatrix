// Navbar - shows on Home page; has logo, links, profile, logout
import { useNavigate, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiRequest } from '../api.js'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState({})
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    apiRequest('/api/auth/me')
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch((requestError) => {
        if (requestError.message === 'Not authenticated.') navigate('/login')
      })
  }, [navigate])

  useEffect(() => {
    apiRequest('/api/expiry-products')
      .then(({ products = [] }) => {
        const alerts = products.filter((item) => item.expiryDate && item.daysRemaining !== null && item.daysRemaining <= 7)
        setUnreadNotifications(alerts.length)
      })
      .catch(() => {
        setUnreadNotifications(0)
      })
  }, [])

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
          <li><NavLink to="/scanner" className={getNavClass} onClick={() => setMenuOpen(false)}>Scanner</NavLink></li>
          <li><NavLink to="/digital-pantry" className={getNavClass} onClick={() => setMenuOpen(false)}>Digital Pantry</NavLink></li>
          <li><NavLink to="/meal-planner" className={getNavClass} onClick={() => setMenuOpen(false)}>Meal Planner</NavLink></li>
          <li><NavLink to="/products" className={getNavClass} onClick={() => setMenuOpen(false)}>Product Analysis</NavLink></li>
          <li><NavLink to="/about" className={getNavClass} onClick={() => setMenuOpen(false)}>About Us</NavLink></li>

          <li className="nav-notification">
            <button
              type="button"
              className="notification-trigger"
              onClick={() => navigate('/notifications')}
              aria-label="Open expiry notifications"
            >
              <span>🔔</span>
              {unreadNotifications > 0 && <span className="notification-count">{unreadNotifications}</span>}
            </button>
          </li>

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
