import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { apiRequest } from '../api.js'
import { getExpiryMeta, getExpirySummary } from '../utils/expiry.js'
import './DigitalPantry.css'

const READ_ITEMS_STORAGE_KEY = 'nutrimatrix-digital-pantry-read-items'

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
  const [isRestoreOpen, setIsRestoreOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasRestoredReadItems, setHasRestoredReadItems] = useState(false)

  useEffect(() => {
    try {
      const savedReadItems = localStorage.getItem(READ_ITEMS_STORAGE_KEY)
      if (savedReadItems) {
        const parsedReadItems = JSON.parse(savedReadItems)
        if (Array.isArray(parsedReadItems)) {
          setReadItems(parsedReadItems)
        }
      }
    } catch (storageError) {
      console.error('Unable to restore pantry read items from storage.', storageError)
    } finally {
      setHasRestoredReadItems(true)
    }
  }, [])

  useEffect(() => {
    // Do not replace saved Restore items with the initial empty state before
    // localStorage has been read on a new page visit.
    if (!hasRestoredReadItems) return

    try {
      localStorage.setItem(READ_ITEMS_STORAGE_KEY, JSON.stringify(readItems))
    } catch (storageError) {
      console.error('Unable to save pantry read items to storage.', storageError)
    }
  }, [hasRestoredReadItems, readItems])

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

  const hiddenItemIds = useMemo(() => new Set(readItems.map((item) => String(item.id))), [readItems])
  const visibleItems = useMemo(() => items.filter((item) => !hiddenItemIds.has(String(item.id))), [items, hiddenItemIds])

  const summary = useMemo(() => getExpirySummary(visibleItems), [visibleItems])

  const summaryGroups = useMemo(() => {
    const groups = {
      expired: [],
      today: [],
      tomorrow: [],
      three: [],
      seven: []
    }

    visibleItems.forEach((item) => {
      const meta = getExpiryMeta(item.expiryDate)
      if (meta.statusKey === 'expired') groups.expired.push(item.name)
      if (meta.statusKey === 'today') groups.today.push(item.name)
      if (meta.statusKey === 'tomorrow') groups.tomorrow.push(item.name)
      if (meta.statusKey === 'three') groups.three.push(item.name)
      if (meta.statusKey === 'seven') groups.seven.push(item.name)
    })

    return groups
  }, [visibleItems])

  const notifications = useMemo(() => {
    return visibleItems
      .filter((item) => item.expiryDate && item.daysRemaining !== null && item.daysRemaining <= 7)
      .map((item) => ({ ...item, ...getExpiryMeta(item.expiryDate) }))
      .sort((a, b) => {
        const priority = { expired: 0, today: 1, tomorrow: 2, three: 3, seven: 4 }
        return (priority[a.statusKey] ?? 99) - (priority[b.statusKey] ?? 99)
      })
  }, [visibleItems])

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return visibleItems

    return visibleItems.filter((item) => {
      const haystack = [item.name, item.brand, item.category, item.expiryDate, item.quantity].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [visibleItems, searchTerm])

  const unreadCount = notifications.filter((item) => item.daysRemaining !== null && item.daysRemaining <= 7).length

  const handleMarkRead = (id) => {
    setItems((current) => {
      const itemIndex = current.findIndex((item) => String(item.id) === String(id))
      if (itemIndex === -1) return current

      const itemToRead = { ...current[itemIndex], originalIndex: itemIndex }

      setReadItems((previousRead) => {
        const alreadyStored = previousRead.some((item) => String(item.id) === String(id))
        return alreadyStored ? previousRead : [...previousRead, itemToRead]
      })

      return current.filter((item) => String(item.id) !== String(id))
    })
  }

  const handleRestoreItem = (id) => {
    setReadItems((current) => {
      const itemToRestore = current.find((item) => String(item.id) === String(id))
      if (!itemToRestore) return current

      setItems((existing) => {
        const nextItems = [...existing]
        const insertIndex = Number.isFinite(itemToRestore.originalIndex) ? Math.min(itemToRestore.originalIndex, nextItems.length) : nextItems.length
        nextItems.splice(insertIndex, 0, itemToRestore)
        return nextItems
      })

      return current.filter((item) => String(item.id) !== String(id))
    })
  }

  const handleRestoreAll = () => {
    if (!readItems.length) return

    setItems((current) => {
      const nextItems = [...current]
      const sortedReadItems = [...readItems].sort((a, b) => {
        const aIndex = Number.isFinite(a.originalIndex) ? a.originalIndex : Number.MAX_SAFE_INTEGER
        const bIndex = Number.isFinite(b.originalIndex) ? b.originalIndex : Number.MAX_SAFE_INTEGER
        return aIndex - bIndex
      })

      sortedReadItems.forEach((item) => {
        const insertIndex = Number.isFinite(item.originalIndex) ? Math.min(item.originalIndex, nextItems.length) : nextItems.length
        nextItems.splice(insertIndex, 0, item)
      })

      return nextItems
    })

    setReadItems([])
  }

  const handleMarkAllRead = () => {
    if (!visibleItems.length) return
    setReadItems((current) => {
      const merged = [...current]
      visibleItems.forEach((item) => {
        if (!merged.some((existingItem) => String(existingItem.id) === String(item.id))) {
          merged.push(item)
        }
      })
      return merged
    })
    setItems((current) => current.filter((item) => hiddenItemIds.has(String(item.id))))
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
              <div className="restore-menu">
                <button
                  type="button"
                  className="restore-menu-btn"
                  onClick={() => setIsRestoreOpen((isOpen) => !isOpen)}
                  aria-expanded={isRestoreOpen}
                >
                  Restore{readItems.length ? ` (${readItems.length})` : ''}
                </button>

                {isRestoreOpen && (
                  <div className="restore-popover">
                    <div className="read-items-header">
                      <h4>Marked as read</h4>
                      {readItems.length > 0 && <button type="button" className="restore-all-btn" onClick={handleRestoreAll}>Restore all</button>}
                    </div>
                    {readItems.length > 0 ? (
                      <ul className="read-items-list">
                        {readItems.map((item) => (
                          <li key={item.id}>
                            <span>{item.name}</span>
                            <button type="button" onClick={() => handleRestoreItem(item.id)}>Restore</button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="restore-empty">No items marked as read.</p>
                    )}
                  </div>
                )}
              </div>
              <button type="button" className="primary-btn" onClick={() => navigate('/scanner')}>Add product</button>
            </div>
          </div>

          {loading ? (
            <p className="loading-state">Loading pantry items...</p>
          ) : error ? (
            <p className="error-state">{error}</p>
          ) : visibleItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🥬</div>
              <h3>Your digital pantry is empty</h3>
              <p>Add groceries from receipt scans or manual entry to start tracking expiry dates.</p>
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
