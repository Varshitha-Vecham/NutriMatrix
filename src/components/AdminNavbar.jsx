import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api.js'
import './AdminNavbar.css'

function AdminNavbar() {
  const navigate = useNavigate()

  function handleLogout() {
    apiRequest('/api/auth/logout', { method: 'POST' }).finally(() => navigate('/admin-login'))
  }

  return (
    <nav className="admin-navbar">
      <div className="admin-nav-inner">
        <button className="admin-nav-brand" onClick={() => navigate('/admin')}>🥗 Nutri<span>Matrix</span><small>ADMIN</small></button>
        <div className="admin-nav-actions">
          <span>Management console</span>
          <button onClick={handleLogout}>↪ Logout</button>
        </div>
      </div>
    </nav>
  )
}

export default AdminNavbar
