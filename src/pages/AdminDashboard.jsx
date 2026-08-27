import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api.js'
import AdminNavbar from '../components/AdminNavbar.jsx'
import './AdminDashboard.css'

const formatValue = (value) => value === null || value === undefined || value === '' ? '—' : value
const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '—'

function AdminDashboard() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [admin, setAdmin] = useState({ name: 'Admin', email: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([apiRequest('/api/auth/me'), apiRequest('/api/admin/users')])
      .then(([auth, result]) => {
        if (auth.user.role !== 'admin') {
          navigate('/home')
          return
        }
        setAdmin(auth.user)
        setUsers(result.users)
      })
      .catch((requestError) => {
        if (requestError.message === 'Not authenticated.') navigate('/admin-login')
        else if (requestError.message === 'Admin access required.') navigate('/home')
        else setError(requestError.message)
      })
      .finally(() => setLoading(false))
  }, [navigate])

  if (loading) return <div className="admin-loading">Loading admin dashboard...</div>

  return (
    <div className="admin-dashboard">
      <AdminNavbar />
      <main className="admin-content">
        <header className="admin-dashboard-header">
          <div><p className="admin-kicker">WELCOME, {admin.name.toUpperCase()}</p><h1>User directory</h1><p>Review registered accounts and their nutrition preferences.</p></div>
          <div className="admin-stat"><strong>{users.length}</strong><span>Registered users</span></div>
        </header>
        {error && <div className="admin-dashboard-error">{error}</div>}
        {!error && users.length === 0 && <div className="admin-empty">No users have registered yet.</div>}
        {!error && users.length > 0 && <div className="admin-table-wrap"><table className="admin-users-table"><thead><tr><th>Account</th><th>Contact</th><th>Personal details</th><th>Nutrition</th><th>Goals & budget</th><th>Settings</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}>
          <td><strong>{user.name}</strong><small>{user.role}</small><small>Joined {formatDate(user.createdAt)}</small></td>
          <td><span>{user.email}</span><span>{formatValue(user.phone)}</span></td>
          <td><span>Age: {formatValue(user.age)}</span><span>Gender: {formatValue(user.gender)}</span><span>Height: {formatValue(user.heightCm)} cm</span><span>Weight: {formatValue(user.weightKg)} kg</span></td>
          <td><span>Diet: {formatValue(user.dietType)}</span><span>Allergies: {formatValue(user.allergies)}</span><span>Dislikes: {formatValue(user.foodDislikes)}</span><span>Cuisines: {formatValue(user.cuisines)}</span></td>
          <td><span>Goal: {formatValue(user.goals)}</span><span>Budget: {user.monthlyBudget ? `₹${user.monthlyBudget}` : '—'}</span><span>Price-conscious: {user.priceConscious ? 'Yes' : 'No'}</span></td>
          <td><span>Notifications: {user.notifications ? 'On' : 'Off'}</span><span>Expiry: {user.expiryReminders ? 'On' : 'Off'}</span><span>AI: {user.aiRecommendations ? 'On' : 'Off'}</span></td>
        </tr>)}</tbody></table></div>}
      </main>
    </div>
  )
}

export default AdminDashboard
