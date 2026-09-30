import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api.js'
import AdminNavbar from '../components/AdminNavbar.jsx'
import './AdminFeedback.css'

const categories = ['Product Analysis', 'Barcode Scanner', 'Digital Pantry', 'Meal Planner', 'Recipe Recommendations', 'Nutrition Information', 'Website Design', 'Other']
const formatDate = (value) => value ? new Date(value).toLocaleString() : '—'

function AdminFeedback() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [category, setCategory] = useState('All categories')
  const [rating, setRating] = useState('All ratings')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([apiRequest('/api/auth/me'), apiRequest('/api/admin/feedback')])
      .then(([auth, result]) => {
        if (auth.user.role !== 'admin') return navigate('/home')
        setItems(result.feedback || [])
      })
      .catch((requestError) => {
        if (requestError.message === 'Not authenticated.') navigate('/admin-login')
        else if (requestError.message === 'Admin access required.') navigate('/home')
        else setError(requestError.message)
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const visibleItems = useMemo(() => items.filter((item) =>
    (category === 'All categories' || item.category === category) &&
    (rating === 'All ratings' || Number(item.rating) === Number(rating))), [items, category, rating])

  if (loading) return <div className="admin-loading">Loading feedback...</div>
  return <div className="admin-dashboard"><AdminNavbar /><main className="admin-content admin-feedback-content">
    <header className="admin-dashboard-header"><div><p className="admin-kicker">NUTRIMATRIX COMMUNITY</p><h1>Feedback Management</h1><p>Review user feedback and filter it by topic or rating.</p></div><div className="admin-stat"><strong>{items.length}</strong><span>Total responses</span></div></header>
    {error && <div className="admin-dashboard-error" role="alert">{error}</div>}
    {!error && <>
      <div className="admin-feedback-filters"><label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Rating<select value={rating} onChange={(event) => setRating(event.target.value)}><option>All ratings</option>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value === 1 ? '' : 's'}</option>)}</select></label><span>{visibleItems.length} shown</span></div>
      {visibleItems.length === 0 ? <div className="admin-empty">No feedback matches these filters.</div> : <div className="admin-table-wrap"><table className="admin-users-table admin-feedback-table"><thead><tr><th>Rating</th><th>Category</th><th>Feedback</th><th>Experience</th><th>Submitted by</th><th>Submitted</th></tr></thead><tbody>{visibleItems.map((item) => <tr key={item.feedbackId}><td><span className="admin-feedback-stars" aria-label={`${item.rating} out of 5 stars`}>{'★'.repeat(item.rating)}<span>{'★'.repeat(5 - item.rating)}</span></span></td><td><strong>{item.category}</strong></td><td className="admin-feedback-message">{item.message}</td><td>{item.experience || '—'}</td><td>{item.userName || 'Account'}{item.email && <small>{item.email}</small>}</td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div>}
    </>}
  </main></div>
}

export default AdminFeedback
