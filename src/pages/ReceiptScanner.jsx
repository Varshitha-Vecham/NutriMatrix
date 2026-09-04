import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest, OCR_API_URL } from '../api.js'
import Navbar from '../components/Navbar.jsx'
import './ReceiptScanner.css'

function formatDateOnly(dateValue) {
  if (!dateValue) return ''
  const [year, month, day] = String(dateValue).slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString()
}

function ReceiptScanner() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [scanned, setScanned] = useState(false)
  const [products, setProducts] = useState([])
  const [trackedProducts, setTrackedProducts] = useState([])
  const [currentReceiptSaved, setCurrentReceiptSaved] = useState(false)
  const [editingHistoryId, setEditingHistoryId] = useState(null)
  const [editingExpiry, setEditingExpiry] = useState('')
  const [expandedReceipt, setExpandedReceipt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadReceiptHistory() {
      try {
        const result = await apiRequest('/api/expiry-products')
        setTrackedProducts(result.products)
      } catch (historyError) {
        if (historyError.message !== 'Not authenticated.') setError(historyError.message)
      }
    }

    loadReceiptHistory()
  }, [])

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('receipt', file)
      const response = await fetch(`${OCR_API_URL}/api/scanner/receipt`, {
        method: 'POST',
        body: formData
      })
      const responseText = await response.text()
      let result
      try {
        result = JSON.parse(responseText)
      } catch {
        throw new Error(`Receipt service returned an unexpected response (${response.status}). Restart Flask on port 5000 and try again.`)
      }
      if (!response.ok) throw new Error(result.message || 'Unable to analyze receipt.')
      setProducts(result.products.map((product) => ({ ...product, expiryDate: product.expiryDate || '' })))
      setCurrentReceiptSaved(false)
      setScanned(true)
    } catch (uploadError) {
      setError(uploadError.name === 'TypeError' && uploadError.message === 'Failed to fetch'
        ? 'Receipt service is not running. Start Flask on http://localhost:5000, then try again.'
        : uploadError.message)
    } finally {
      setLoading(false)
    }
  }

  function updateExpiry(index, expiryDate) {
    setProducts((current) => current.map((product, productIndex) => productIndex === index ? { ...product, expiryDate } : product))
  }

  function removeProduct(index) {
    setProducts((current) => current.filter((_, productIndex) => productIndex !== index))
  }

  function uploadAnotherReceipt() {
    setFileName('')
    setScanned(false)
    setProducts([])
    setCurrentReceiptSaved(false)
    setError('')
    setMessage('')
    if (inputRef.current) inputRef.current.value = ''
  }

  async function saveProducts() {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await apiRequest('/api/expiry-products', {
        method: 'POST',
        body: JSON.stringify({ receiptFileName: fileName, products })
      })
      const result = await apiRequest('/api/expiry-products')
      setTrackedProducts(result.products)
      setCurrentReceiptSaved(true)
      setScanned(false)
      setProducts([])
      setFileName('')
      setMessage('Receipt products saved. Expiry reminders will use the dates you confirmed.')
    } catch (saveError) {
      setError(saveError.message === 'Not authenticated.' ? 'Please log in to save expiry dates.' : saveError.message)
    } finally {
      setSaving(false)
    }
  }

  function beginHistoryEdit(product) {
    setEditingHistoryId(product.id)
    setEditingExpiry(product.expiryDate || '')
  }

  async function saveHistoryEdit(productId) {
    try {
      await apiRequest(`/api/expiry-products/${productId}`, { method: 'PUT', body: JSON.stringify({ expiryDate: editingExpiry }) })
      const result = await apiRequest('/api/expiry-products')
      setTrackedProducts(result.products)
      setEditingHistoryId(null)
      setMessage('Expiry date updated.')
    } catch (editError) {
      setError(editError.message)
    }
  }

  async function deleteHistoryProduct(productId) {
    if (!window.confirm('Delete this product from receipt history?')) return
    try {
      await apiRequest(`/api/expiry-products/${productId}`, { method: 'DELETE' })
      setTrackedProducts((current) => current.filter((product) => product.id !== productId))
      setMessage('Product deleted from receipt history.')
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  async function deleteReceiptHistory(receipt) {
    if (!window.confirm(`Delete all products from ${receipt.name}?`)) return
    try {
      await apiRequest(`/api/expiry-products/receipt/${encodeURIComponent(receipt.name)}/${receipt.date}`, { method: 'DELETE' })
      setTrackedProducts((current) => current.filter((product) => !(product.receiptFileName === receipt.name && product.purchasedAt === receipt.date)))
      setMessage('Receipt deleted from history.')
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  return (
    <div className="receipt-page">
      <Navbar />
      <main className="receipt-content">
        <button className="receipt-back" onClick={() => navigate('/scanner')}>
          ← Back to Scanner
        </button>

        <span className="method-kicker">Multiple product identification</span>
        <h1>
          Receipt <em>Scanner</em>
        </h1>
        <p className="receipt-subtitle">
          Upload a grocery receipt to identify multiple products at once.
        </p>

        <section className="receipt-box">
          <div className="receipt-icon">🧾</div>
          <h2>{loading ? 'Reading receipt...' : scanned ? 'Receipt ready to review' : 'Upload your receipt'}</h2>
          <p>
            {fileName || 'Choose a clear photo or PDF of your grocery receipt.'}
          </p>

          {scanned ? (
            <div className="receipt-actions">
              <button className="receipt-primary" onClick={() => document.querySelector('.receipt-products')?.scrollIntoView({ behavior: 'smooth' })}>
                Review Expiry Dates →
              </button>
              {currentReceiptSaved && <button className="receipt-primary" onClick={uploadAnotherReceipt}>
                Upload Another Receipt
              </button>}
            </div>
          ) : (
            <>
              <button className="receipt-primary" disabled={loading} onClick={() => inputRef.current?.click()}>
                {currentReceiptSaved ? 'Upload Another Receipt' : 'Upload Receipt'}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,.pdf"
                hidden
                onChange={handleUpload}
              />
            </>
          )}
        </section>
        {error && <p className="receipt-error" role="alert">{error}</p>}
        {message && <p className="receipt-message" role="status">{message}</p>}
        {scanned && <section className="receipt-products" aria-labelledby="receipt-products-title">
          <div className="receipt-section-heading"><span className="method-kicker">Expiry tracking</span><h2 id="receipt-products-title">Products detected</h2><p>Receipts often do not contain expiry dates. Confirm the date from each product package; dates are never guessed.</p></div>
          <div className="receipt-product-list">
            {products.map((product, index) => <article className="receipt-product" key={product.id}>
              <div><strong>{product.name}</strong><span>{product.quantity ? `Qty: ${product.quantity}` : 'Qty: not detected'}</span></div>
              <div><strong>Amount</strong><span>{product.amount == null ? 'Not detected' : `₹${Number(product.amount).toFixed(2)}`}</span></div>
              <label>Expiry date <input type="date" value={product.expiryDate} onChange={(event) => updateExpiry(index, event.target.value)} /></label>
              <div><span className={product.expiryDate ? 'expiry-confirmed' : 'expiry-unavailable'}>{product.expiryDate ? 'Date confirmed' : 'Expiry date not available'}</span><button className="receipt-remove" onClick={() => removeProduct(index)}>Remove product</button></div>
            </article>)}
          </div>
          <button className="receipt-primary receipt-save" disabled={saving || products.every((product) => !product.expiryDate)} onClick={saveProducts}>{saving ? 'Saving...' : 'Save Products & Expiry Dates'}</button>
        </section>}
        {trackedProducts.length > 0 && <section className="tracked-products"><div className="receipt-section-heading"><span className="method-kicker">Saved scans</span><h2>Receipt history</h2><p>Click a receipt name to view its product details.</p></div><div className="receipt-history-list">{Object.entries(trackedProducts.reduce((receipts, product) => { const key = `${product.receiptFileName}-${product.purchasedAt}`; if (!receipts[key]) receipts[key] = { name: product.receiptFileName, date: product.purchasedAt, products: [] }; receipts[key].products.push(product); return receipts }, {})).map(([receiptKey, receipt]) => <article className="receipt-history" key={receiptKey}><div className="receipt-history-heading"><button className="receipt-history-toggle" onClick={() => setExpandedReceipt((current) => current === receiptKey ? null : receiptKey)} aria-expanded={expandedReceipt === receiptKey}><strong>{receipt.name}</strong><span>{receipt.date ? formatDateOnly(receipt.date) : 'Purchase date unavailable'} · {receipt.products.length} product{receipt.products.length === 1 ? '' : 's'} <span aria-hidden="true">{expandedReceipt === receiptKey ? '▲' : '▼'}</span></span></button><button className="history-delete-receipt" onClick={() => deleteReceiptHistory(receipt)}>Delete Receipt</button></div></article>)}</div></section>}
        {expandedReceipt && <div className="receipt-modal-backdrop" onClick={() => setExpandedReceipt(null)}><section className="receipt-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-modal-title" onClick={(event) => event.stopPropagation()}>{Object.entries(trackedProducts.reduce((receipts, product) => { const key = `${product.receiptFileName}-${product.purchasedAt}`; if (!receipts[key]) receipts[key] = { name: product.receiptFileName, date: product.purchasedAt, products: [] }; receipts[key].products.push(product); return receipts }, {})).filter(([receiptKey]) => receiptKey === expandedReceipt).map(([receiptKey, receipt]) => <div key={receiptKey}><div className="receipt-modal-heading"><div><span className="method-kicker">Receipt details</span><h2 id="receipt-modal-title">{receipt.name}</h2></div><button className="receipt-modal-close" onClick={() => setExpandedReceipt(null)} aria-label="Close receipt details">×</button></div><div className="receipt-product-list">{receipt.products.map((product) => <div className="receipt-history-product" key={product.id}><div><strong>{product.name}</strong><span>{product.brand || 'Receipt product'}{product.barcode ? ` · Barcode ${product.barcode}` : ''}</span></div>{editingHistoryId === product.id ? <div className="history-edit"><label>Expiry date <input type="date" value={editingExpiry} onChange={(event) => setEditingExpiry(event.target.value)} /></label><button onClick={() => saveHistoryEdit(product.id)}>Save</button><button onClick={() => setEditingHistoryId(null)}>Cancel</button></div> : <div className="history-details"><strong>{product.expiryDate ? formatDateOnly(product.expiryDate) : 'Not available'}</strong><span>{product.expiryDate ? `${product.daysRemaining < 0 ? Math.abs(product.daysRemaining) + ' days overdue' : product.daysRemaining + ' days remaining'} · ${product.status}` : 'Add the date from the package'}</span><div className="history-actions"><button onClick={() => beginHistoryEdit(product)}>Edit expiry</button><button onClick={() => deleteHistoryProduct(product.id)}>Delete</button></div></div>}</div>)}</div></div>)}</section></div>}
      </main>
    </div>
  )
}

export default ReceiptScanner