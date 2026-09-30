import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { apiRequest } from '../api.js'
import { getExpiryMeta } from '../utils/expiry.js'
import './Notifications.css'

const toneClass = {
  danger: 'tone-danger',
  warning: 'tone-warning',
  info: 'tone-info',
  success: 'tone-success',
  neutral: 'tone-neutral'
}

function Notifications() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [readItems, setReadItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiRequest('/api/expiry-products')
      .then(({ products }) => {
        setItems(products || [])
      })
      .catch((requestError) => {
        if (requestError.message === 'Not authenticated.') {
          navigate('/login')
          return
        }
        setError('Unable to load notifications right now.')
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const notifications = useMemo(() => {
    return items
      .filter((item) => item.expiryDate && item.daysRemaining !== null && item.daysRemaining <= 7)
      .map((item) => ({ ...item, ...getExpiryMeta(item.expiryDate) }))
      .sort((a, b) => {
        const priority = { expired: 0, today: 1, tomorrow: 2, three: 3, seven: 4 }
        return (priority[a.statusKey] ?? 99) - (priority[b.statusKey] ?? 99)
      })
  }, [items])

  const handleMarkRead = (id) => {
    setItems((current) => {
      const itemToRead = current.find((item) => item.id === id)
      if (!itemToRead) return current

      setReadItems((previousRead) => {
        const alreadyStored = previousRead.some((item) => item.id === id)
        return alreadyStored ? previousRead : [...previousRead, itemToRead]
      })

      return current.filter((item) => item.id !== id)
    })
  }

  const handleRestoreItem = (id) => {
    setReadItems((current) => {
      const itemToRestore = current.find((item) => item.id === id)
      if (!itemToRestore) return current

      setItems((existing) => [itemToRestore, ...existing])
      return current.filter((item) => item.id !== id)
    })
  }

  const handleRestoreAll = () => {
    if (!readItems.length) return
    setItems((current) => [...readItems, ...current])
    setReadItems([])
  }

  const handleMarkAllRead = () => {
    if (!items.length) return
    setReadItems((current) => [...current, ...items])
    setItems([])
  }

  const getDayText = (item) => {
    if (item.daysRemaining === null) return 'Review pantry'
    if (item.daysRemaining < 0) return `${Math.abs(item.daysRemaining)} overdue`
    if (item.daysRemaining === 0) return 'Remaining: 0 days'
    return `Remaining: ${item.daysRemaining} days`
  }

  return (
    <div className="notifications-page">
      <Navbar />

      <main className="notifications-shell">
        <div className="notifications-header-row">
          <h1>Notifications</h1>
          <button type="button" className="notifications-mark-all" onClick={handleMarkAllRead}>Mark all as read</button>
        </div>

        {loading ? (
          <p className="notifications-state">Loading notifications...</p>
        ) : error ? (
          <p className="notifications-state error">{error}</p>
        ) : (
          <div className="notifications-list-wrap">
            {notifications.length ? (
              notifications.map((item) => (
                <article key={item.id} className={`notification-item ${toneClass[item.tone] || 'tone-neutral'}`}>
                  <div className="notification-status">{item.label}</div>
                  <h2>{item.name}</h2>
                  <p>{getDayText(item)}</p>
                  <button type="button" className="notification-read-btn" onClick={() => handleMarkRead(item.id)}>Mark as read</button>
                </article>
              ))
            ) : (
              <div className="notifications-empty">No active expiry alerts right now.</div>
            )}
          </div>
        )}

        {readItems.length > 0 && (
          <div className="notifications-read-box">
            <div className="notifications-read-header">
              <h3>Recently marked as read</h3>
              <button type="button" className="restore-all-btn" onClick={handleRestoreAll}>Restore all</button>
            </div>
            <ul className="notifications-read-list">
              {readItems.map((item) => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <button type="button" onClick={() => handleRestoreItem(item.id)}>Restore</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default Notifications
