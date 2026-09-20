import { useEffect, useState } from 'react'
import { apiRequest } from '../api.js'

const emptyForm = { name: '', brand: '', category: '', barcode: '', quantity: '', unit: '', manufacturingDate: '', expiryDate: '' }

function SavedProductDetails({ product }) {
  const details = [
    ['Brand', product.brand], ['Category', product.category], ['Barcode / Product ID', product.barcode],
    ['Quantity', product.quantity && product.unit ? `${product.quantity} ${product.unit}` : product.quantity || product.unit],
    ['Manufacturing date', product.manufacturingDate], ['Expiry date', product.expiryDate]
  ].filter(([, value]) => value)
  return <section className="manual-saved-product" aria-live="polite"><span className="manual-saved-status">✓ Product saved</span><h3>{product.name}</h3><p>Your manually entered product details have been saved.</p><dl>{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
}

function ManualHistory({ products, onDelete }) {
  const [expandedId, setExpandedId] = useState(null)
  if (!products.length) return <div className="manual-history-empty">Saved manual products will appear here.</div>

  return <div className="manual-history-list">{products.map((product) => {
    const expanded = expandedId === product.id
    const details = [
      ['Product name', product.name], ['Brand', product.brand], ['Category', product.category], ['Barcode / Product ID', product.barcode],
      ['Quantity', product.quantity && product.unit ? `${product.quantity} ${product.unit}` : product.quantity || product.unit],
      ['Manufacturing date', product.manufacturingDate], ['Expiry date', product.expiryDate]
    ].map(([label, value]) => [label, value || 'Not entered'])
    return <article className={`manual-history-item ${expanded ? 'expanded' : ''}`} key={product.id}>
      <button className="manual-history-toggle" type="button" onClick={() => setExpandedId(expanded ? null : product.id)} aria-expanded={expanded}>
        <span><strong>{product.name}</strong><small>{product.brand || 'Manual entry'}{product.barcode ? ` · ${product.barcode}` : ''}</small><small className="manual-history-expiry">{product.expiryDate ? `Expires ${product.expiryDate}` : 'No expiry date added'}</small></span>
        <span className="manual-history-chevron" aria-hidden="true">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && <dl className="manual-history-details">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
      <button type="button" onClick={() => onDelete(product.id)} aria-label={`Delete ${product.name} from history`}>Delete</button>
    </article>
  })}</div>
}

function ManualEntry() {
  const [form, setForm] = useState(emptyForm)
  const [savedProduct, setSavedProduct] = useState(null)
  const [history, setHistory] = useState([])
  const [saveMessage, setSaveMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    apiRequest('/api/expiry-products')
      .then(({ products }) => setHistory(products.filter((product) => product.receiptFileName === 'Manual entry')))
      .catch((requestError) => { if (requestError.message !== 'Not authenticated.') setError(requestError.message) })
  }, [])

  function updateField(event) { const { name, value } = event.target; setForm((current) => ({ ...current, [name]: value })) }
  function saveProduct(event) {
    event.preventDefault()
    setError('')
    const formElement = event.currentTarget
    const product = { ...form }
    apiRequest('/api/expiry-products', {
      method: 'POST',
      body: JSON.stringify({ receiptFileName: 'Manual entry', products: [product] })
    }).then(() => apiRequest('/api/expiry-products')).then(({ products }) => {
      setSavedProduct(product)
      setHistory(products.filter((item) => item.receiptFileName === 'Manual entry'))
      setForm(emptyForm)
      formElement.reset()
      setSaveMessage('Product saved successfully.')
    }).catch((requestError) => setError(requestError.message))
  }

  function deleteHistoryProduct(id) {
    apiRequest(`/api/expiry-products/${id}`, { method: 'DELETE' })
      .then(() => setHistory((current) => current.filter((product) => product.id !== id)))
      .catch((requestError) => setError(requestError.message))
  }

  return <div className="manual-entry-layout"><div className="manual-entry-form"><span className="modal-icon">⌨️</span><h2>Manual Product Entry</h2><p>Add product, quantity, and expiry details.</p>{saveMessage && <p className="manual-save-message" role="status">✓ {saveMessage}</p>}{error && <p className="manual-error" role="alert">{error}</p>}<form className="manual-form" onSubmit={saveProduct}><fieldset><legend>1. Product Information</legend><div className="manual-fields"><label>Product Name*<input required name="name" value={form.name} onChange={updateField} placeholder="e.g. Almond milk" /></label><label>Brand Name<input name="brand" value={form.brand} onChange={updateField} placeholder="Brand" /></label><label>Category*<select required name="category" value={form.category} onChange={updateField}><option value="">Select category</option><option>Fruits</option><option>Vegetables</option><option>Dairy</option><option>Grains</option><option>Snacks</option><option>Beverages</option></select></label><label>Barcode / Product ID<input name="barcode" value={form.barcode} onChange={updateField} placeholder="Optional ID" /></label></div></fieldset><fieldset><legend>2. Quantity Details</legend><div className="manual-fields"><label>Quantity<input type="number" min="0" step="any" name="quantity" value={form.quantity} onChange={updateField} placeholder="0" /></label><label>Unit<select name="unit" value={form.unit} onChange={updateField}><option value="">Select unit</option><option>kg</option><option>g</option><option>L</option><option>ml</option><option>pieces</option><option>packets</option></select></label></div></fieldset><fieldset><legend>3. 📅 Expiry Information</legend><div className="manual-fields"><label>Manufacturing Date<input type="date" name="manufacturingDate" value={form.manufacturingDate} onChange={updateField} /></label><label>Expiry Date<input type="date" name="expiryDate" value={form.expiryDate} onChange={updateField} /></label></div></fieldset><button className="manual-submit" type="submit">Save Product</button></form>{savedProduct && <SavedProductDetails product={savedProduct} />}</div><aside className="manual-history"><div className="manual-history-heading"><span className="method-kicker">Saved products</span><h2>Manual history</h2><p>Your history is linked to your account.</p></div><ManualHistory products={history} onDelete={deleteHistoryProduct} /></aside></div>
}

export default ManualEntry
