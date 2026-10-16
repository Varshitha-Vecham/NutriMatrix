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

function isReceiptScanProduct(product) {
  return String(product.source || '').startsWith('receipt') && product.receiptFileName !== 'Manual entry'
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
  const saveInProgress = useRef(false)

  useEffect(() => {
    async function loadReceiptHistory() {
      try {
        const result = await apiRequest('/api/expiry-products')
        setTrackedProducts(result.products.filter(isReceiptScanProduct))
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
      const detectedProducts = Array.isArray(result.products) ? result.products.map((product) => ({ ...product, expiryDate: product.expiryDate || '', quantity: product.quantity || '', amount: product.amount ?? product.price ?? '' })) : []
      if (!detectedProducts.length) throw new Error('No products were detected. Try a clearer receipt or add items manually.')
      setProducts(detectedProducts)
      setCurrentReceiptSaved(false)
      setScanned(true)
      setMessage('Review the detected products and save when they are correct.')
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

  function updateProduct(index, field, value) {
    setProducts((current) => current.map((product, productIndex) => productIndex === index ? { ...product, [field]: value } : product))
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

  function cancelReview() {
    if (products.length && !window.confirm('Discard the detected items? They will not be saved.')) return
    uploadAnotherReceipt()
  }

  function addProduct() {
    setProducts((current) => [...current, { id: `manual-${Date.now()}`, name: '', quantity: '', amount: '', expiryDate: '', source: 'receipt' }])
  }

  async function saveProducts() {
    if (saveInProgress.current) return
    const reviewedProducts = products.map((product) => ({ ...product, name: String(product.name || '').trim(), quantity: String(product.quantity || '').trim(), amount: product.amount === '' ? null : Number(product.amount) }))
    if (!reviewedProducts.length) { setError('Add at least one product before saving.'); return }
    if (reviewedProducts.some((product) => !product.name)) { setError('Each product needs a name before saving.'); return }
    if (reviewedProducts.some((product) => product.amount != null && (!Number.isFinite(product.amount) || product.amount < 0))) { setError('Prices must be valid positive amounts.'); return }
    saveInProgress.current = true
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await apiRequest('/api/expiry-products', {
        method: 'POST',
        body: JSON.stringify({ receiptFileName: fileName, products: reviewedProducts })
      })
      const result = await apiRequest('/api/expiry-products')
      setTrackedProducts(result.products.filter(isReceiptScanProduct))
      setCurrentReceiptSaved(true)
      setScanned(false)
      setProducts([])
      setFileName('')
      setMessage('Receipt saved. Expiry reminders will use the dates you confirmed.')
    } catch (saveError) {
      setError(saveError.message === 'Not authenticated.' ? 'Please log in to save expiry dates.' : saveError.message)
    } finally {
      saveInProgress.current = false
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
      setTrackedProducts(result.products.filter(isReceiptScanProduct))
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
                Review detected items →
              </button>
              <button className="receipt-cancel" type="button" onClick={cancelReview}>Cancel</button>
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
          <div className="receipt-section-heading"><span className="method-kicker">Review before saving</span><h2 id="receipt-products-title">Products detected</h2><p>Check every field before saving. Expiry dates are optional and are never guessed.</p></div>
          <div className="receipt-product-list">
            {products.map((product, index) => <article className="receipt-product receipt-review-row" key={product.id || `${product.name}-${index}`}>
              <label>Product name<input type="text" value={product.name} onChange={(event) => updateProduct(index, 'name', event.target.value)} placeholder="Product name" /></label>
              <label>Quantity<input type="text" value={product.quantity} onChange={(event) => updateProduct(index, 'quantity', event.target.value)} placeholder="Not detected" /></label>
              <label>Price<input type="number" min="0" step="0.01" value={product.amount} onChange={(event) => updateProduct(index, 'amount', event.target.value)} placeholder="Not detected" /></label>
              <label>Expiry date<input type="date" value={product.expiryDate} onChange={(event) => updateExpiry(index, event.target.value)} /></label>
              <button className="receipt-remove" type="button" onClick={() => removeProduct(index)}>Remove</button>
            </article>)}
          </div>
          <div className="receipt-review-actions"><button className="receipt-add-product" type="button" onClick={addProduct}>+ Add missing item</button><button className="receipt-cancel" type="button" onClick={cancelReview} disabled={saving}>Cancel</button><button className="receipt-primary receipt-save" disabled={saving} onClick={saveProducts}>{saving ? 'Saving...' : 'Save receipt'}</button></div>
        </section>}
        {trackedProducts.length > 0 && <section className="tracked-products"><div className="receipt-section-heading"><span className="method-kicker">Saved scans</span><h2>Receipt history</h2><p>Click a receipt name to view its product details.</p></div><div className="receipt-history-list">{Object.entries(trackedProducts.reduce((receipts, product) => { const key = `${product.receiptFileName}-${product.purchasedAt}`; if (!receipts[key]) receipts[key] = { name: product.receiptFileName, date: product.purchasedAt, products: [] }; receipts[key].products.push(product); return receipts }, {})).map(([receiptKey, receipt]) => <article className="receipt-history" key={receiptKey}><div className="receipt-history-heading"><button className="receipt-history-toggle" onClick={() => setExpandedReceipt((current) => current === receiptKey ? null : receiptKey)} aria-expanded={expandedReceipt === receiptKey}><strong>{receipt.name}</strong><span>{receipt.date ? formatDateOnly(receipt.date) : 'Purchase date unavailable'} · {receipt.products.length} product{receipt.products.length === 1 ? '' : 's'} <span aria-hidden="true">{expandedReceipt === receiptKey ? '▲' : '▼'}</span></span></button><button className="history-delete-receipt" onClick={() => deleteReceiptHistory(receipt)}>Delete Receipt</button></div></article>)}</div></section>}
        {expandedReceipt && <div className="receipt-modal-backdrop" onClick={() => setExpandedReceipt(null)}><section className="receipt-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-modal-title" onClick={(event) => event.stopPropagation()}>{Object.entries(trackedProducts.reduce((receipts, product) => { const key = `${product.receiptFileName}-${product.purchasedAt}`; if (!receipts[key]) receipts[key] = { name: product.receiptFileName, date: product.purchasedAt, products: [] }; receipts[key].products.push(product); return receipts }, {})).filter(([receiptKey]) => receiptKey === expandedReceipt).map(([receiptKey, receipt]) => <div key={receiptKey}><div className="receipt-modal-heading"><div><span className="method-kicker">Receipt details</span><h2 id="receipt-modal-title">{receipt.name}</h2></div><button className="receipt-modal-close" onClick={() => setExpandedReceipt(null)} aria-label="Close receipt details">×</button></div><div className="receipt-product-list">{receipt.products.map((product) => <div className="receipt-history-product" key={product.id}><div><strong>{product.name}</strong><span>{product.brand || 'Receipt product'}{product.barcode ? ` · Barcode ${product.barcode}` : ''}{product.quantity ? ` · Qty ${product.quantity}` : ''}{product.amount != null ? ` · ₹${Number(product.amount).toFixed(2)}` : ''}</span></div>{editingHistoryId === product.id ? <div className="history-edit"><label>Expiry date <input type="date" value={editingExpiry} onChange={(event) => setEditingExpiry(event.target.value)} /></label><button onClick={() => saveHistoryEdit(product.id)}>Save</button><button onClick={() => setEditingHistoryId(null)}>Cancel</button></div> : <div className="history-details"><strong>{product.expiryDate ? formatDateOnly(product.expiryDate) : 'Not available'}</strong><span>{product.expiryDate ? `${product.daysRemaining < 0 ? Math.abs(product.daysRemaining) + ' days overdue' : product.daysRemaining + ' days remaining'} · ${product.status}` : 'Add the date from the package'}</span><div className="history-actions"><button onClick={() => beginHistoryEdit(product)}>Edit expiry</button><button onClick={() => deleteHistoryProduct(product.id)}>Delete</button></div></div>}</div>)}</div></div>)}</section></div>}
      </main>
    </div>
  )
}

export default ReceiptScanner
