// Navbar - shows on Home page; has logo, links, profile, logout
import { useNavigate, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiRequest } from '../api.js'
import { loadReadItems, subscribeToReadItems } from '../utils/pantryReadState.js'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState({})
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const updateUnreadCount = (products = [], readItems = loadReadItems()) => {
    const readIds = new Set(readItems.map((item) => String(item.id)))
    const alerts = products.filter((item) => item.expiryDate && item.daysRemaining !== null && item.daysRemaining <= 7 && !readIds.has(String(item.id)))
    setUnreadNotifications(alerts.length)
  }

  useEffect(() => {
    const isPublicRoute = window.location.pathname === '/recipe-generator'

    apiRequest('/api/auth/me')
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch((requestError) => {
        if (requestError.message === 'Not authenticated.' && !isPublicRoute) navigate('/login')
      })
  }, [navigate])

  useEffect(() => {
    let currentProducts = []
    apiRequest('/api/expiry-products')
      .then(({ products = [] }) => {
        currentProducts = products
        updateUnreadCount(currentProducts)
      })
      .catch(() => {
        setUnreadNotifications(0)
      })
    return subscribeToReadItems((readItems) => updateUnreadCount(currentProducts, readItems))
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
          <li><NavLink to="/feedback" className={getNavClass} onClick={() => setMenuOpen(false)}>Feedback</NavLink></li>
          <li><NavLink to="/about" className={getNavClass} onClick={() => setMenuOpen(false)}>About Us</NavLink></li>

          <li className="nav-notification">
            <button
              type="button"
              className="notification-trigger"
              onClick={() => navigate('/notifications')}
              aria-label="Open expiry notifications"
            >
              <span>🔔</span>
              <span className="notification-count">{unreadNotifications}</span>
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
