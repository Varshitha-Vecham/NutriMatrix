import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { apiRequest } from '../api.js'
import { getExpiryMeta, getExpirySummary } from '../utils/expiry.js'
import './DigitalPantry.css'

const toneClass = {
  danger: 'tone-danger',
  warning: 'tone-warning',
  info: 'tone-info',
  success: 'tone-success',
  neutral: 'tone-neutral'
}

function DigitalPantry() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [readItems, setReadItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
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
        setError('Unable to load your pantry data right now.')
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const summary = useMemo(() => getExpirySummary(items), [items])

  const summaryGroups = useMemo(() => {
    const groups = {
      expired: [],
      today: [],
      tomorrow: [],
      three: [],
      seven: []
    }

    items.forEach((item) => {
      const meta = getExpiryMeta(item.expiryDate)
      if (meta.statusKey === 'expired') groups.expired.push(item.name)
      if (meta.statusKey === 'today') groups.today.push(item.name)
      if (meta.statusKey === 'tomorrow') groups.tomorrow.push(item.name)
      if (meta.statusKey === 'three') groups.three.push(item.name)
      if (meta.statusKey === 'seven') groups.seven.push(item.name)
    })

    return groups
  }, [items])

  const notifications = useMemo(() => {
    return items
      .filter((item) => item.expiryDate && item.daysRemaining !== null && item.daysRemaining <= 7)
      .map((item) => ({ ...item, ...getExpiryMeta(item.expiryDate) }))
      .sort((a, b) => {
        const priority = { expired: 0, today: 1, tomorrow: 2, three: 3, seven: 4 }
        return (priority[a.statusKey] ?? 99) - (priority[b.statusKey] ?? 99)
      })
  }, [items])

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return items

    return items.filter((item) => {
      const haystack = [item.name, item.brand, item.category, item.expiryDate, item.quantity].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [items, searchTerm])

  const unreadCount = notifications.filter((item) => item.daysRemaining !== null && item.daysRemaining <= 7).length

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
    setReadItems((current) => [...current, ...items])
    setItems([])
  }

  const handleViewProduct = () => {
    navigate('/products')
  }

  return (
    <div className="pantry-page">
      <Navbar />

      <main className="pantry-shell">
        <section className="pantry-header">
          <div>
            <span className="section-badge">📦 Digital Pantry</span>
            <h1>Expiry reminders and pantry overview</h1>
          </div>

          <div className="notification-bell-wrap">
            <button type="button" className="notification-bell" onClick={() => navigate('/notifications')} aria-label="Open expiry notifications">
              🔔
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
          </div>
        </section>

        <section className="summary-grid">
          {[
            { key: 'expired', label: 'Expired', value: summary.expired, items: summaryGroups.expired },
            { key: 'today', label: 'Today', value: summary.today, items: summaryGroups.today },
            { key: 'tomorrow', label: 'Tomorrow', value: summary.tomorrow, items: summaryGroups.tomorrow },
            { key: 'three', label: 'Within 3 Days', value: summary.three, items: summaryGroups.three },
            { key: 'seven', label: 'Within 7 Days', value: summary.seven, items: summaryGroups.seven }
          ].map((card) => (
            <div key={card.key} className="summary-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <ul className="summary-item-list">
                {card.items.length ? card.items.slice(0, 3).map((itemName) => <li key={itemName}>{itemName}</li>) : <li className="summary-empty">No items</li>}
              </ul>
            </div>
          ))}
        </section>

        <section className="pantry-panel">
          <div className="panel-header">
            <h2>All pantry items</h2>
            <div className="toolbar-actions">
              <div className="search-box">
                <span>🔎</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search pantry item"
                  aria-label="Search pantry items"
                />
              </div>
              <button type="button" className="primary-btn" onClick={() => navigate('/scanner')}>Add product</button>
            </div>
          </div>

          {loading ? (
            <p className="loading-state">Loading pantry items...</p>
          ) : error ? (
            <p className="error-state">{error}</p>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🥬</div>
              <h3>Your digital pantry is empty</h3>
              <p>Add groceries from receipt scans, barcode scanning, or manual entry to start tracking expiry dates.</p>
            </div>
          ) : (
            <div className="pantry-grid" id="pantry-items">
              {filteredItems.map((item) => {
                const meta = getExpiryMeta(item.expiryDate)
                return (
                  <article key={item.id} className={`pantry-item ${toneClass[meta.tone] || 'tone-neutral'}`}>
                    <div className="item-body">
                      <div className="item-topline">
                        <div>
                          <h3>{item.name}</h3>
                          <p>{item.brand || 'NutriMatrix product'}</p>
                        </div>
                        <span className="status-pill">{meta.label}</span>
                      </div>

                      <div className="meta-grid">
                        <span><strong>Category:</strong> {item.category || 'General'}</span>
                        <span><strong>Expiry:</strong> {item.expiryDate || 'Not added'}</span>
                        <span><strong>Days:</strong> {meta.daysRemaining === null ? 'N/A' : (meta.daysRemaining < 0 ? `${Math.abs(meta.daysRemaining)} overdue` : `${meta.daysRemaining} days`)}</span>
                        <span><strong>Qty:</strong> {item.quantity || '1'} {item.unit || 'pack'}</span>
                      </div>

                      <div className="item-actions">
                        <button type="button" className="secondary-btn" onClick={handleViewProduct}>View Product</button>
                        <button type="button" className="text-btn" onClick={() => handleMarkRead(item.id)}>Mark as read</button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default DigitalPantry
