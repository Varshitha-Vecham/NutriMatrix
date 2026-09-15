import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import './Scanner.css'

const sampleProduct = {
  name: 'Organic Rolled Oats',
  brand: 'Harvest & Co.',
  barcode: '8901030894567',
  category: 'Breakfast cereals',
  description: 'Whole grain oats with no added sugar, made for a nourishing start to the day.',
  image: 'https://images.unsplash.com/photo-1517093728432-a0440f8d45af?auto=format&fit=crop&w=900&q=85'
}

const methods = [
  { icon: '🧾', title: 'Receipt Scan', description: 'Upload or capture a grocery receipt to identify multiple products at once.', action: 'Scan Receipt →', path: '/receipt-scanner', tone: 'receipt' },
  { icon: '📷', title: 'Barcode Scan', description: 'Use your camera to scan a product barcode and quickly identify the product.', action: 'Scan Barcode →', path: '/barcode-scanner', tone: 'barcode' },
  { icon: '🎤', title: 'Voice Input', description: 'Say the name of a grocery product and let NutriMatrix identify it.', action: 'Use Voice →', tone: 'voice' },
  { icon: '⌨️', title: 'Manual Entry', description: 'Type the product name manually to find and analyze it.', action: 'Enter Product →', tone: 'manual' }
]

function LegacyBarcodeScanner() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const scanTimerRef = useRef(null)
  const [isScanning, setIsScanning] = useState(false)
  const [product, setProduct] = useState(null)
  const [uploadedFile, setUploadedFile] = useState('')
  const [recentScans, setRecentScans] = useState([])

  useEffect(() => () => clearTimeout(scanTimerRef.current), [])

  function completeScan(scannedProduct) {
    setIsScanning(false)
    setProduct(scannedProduct)
    setRecentScans((scans) => [
      { ...scannedProduct, date: 'Just now', icon: '🥣' },
      ...scans.filter((scan) => scan.barcode !== scannedProduct.barcode)
    ])
  }

  function startScanner() {
    setIsScanning(true)
    setProduct(null)
  }

  function stopScanner() {
    clearTimeout(scanTimerRef.current)
    setIsScanning(false)
  }

  function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadedFile(file.name)
    completeScan(sampleProduct)
  }

  return (
    <div className="scanner-page">
      <Navbar />
      <main className="scanner-content">
        <header className="scanner-header">
          <div>
            <span className="scanner-kicker">Smart grocery tools <span>•</span> 01</span>
            <h1>Product <em>Scanner</em></h1>
            <p>Scan a product barcode to quickly identify and analyze the product.</p>
          </div>
          <button className="back-button" onClick={() => navigate('/home')}><span>←</span> Back to Home</button>
        </header>

        <div className="scanner-layout">
          <section className="scanner-panel" aria-labelledby="scanner-panel-title">
            <div className="panel-heading">
              <div className="heading-icon">⌁</div>
              <div>
                <h2 id="scanner-panel-title">Scan a product</h2>
                <p>Use your camera or upload a barcode image.</p>
              </div>
              <span className={`scanner-status ${isScanning ? 'live' : ''}`}><i />{isScanning ? 'Live' : 'Ready'}</span>
            </div>

            <div className={`camera-preview ${isScanning ? 'active' : ''}`}>
              <div className="camera-grid" />
              <div className="scan-frame"><span /><span /><span /><span /></div>
              <div className="camera-copy">
                <strong>{isScanning ? 'Looking for a barcode...' : 'Camera preview'}</strong>
                <small>Place the product barcode inside the frame</small>
              </div>
              <div className="preview-mark">⌾</div>
            </div>

            <div className="scanner-actions">
              {!isScanning ? (
                <button className="start-button" onClick={startScanner}><span>◉</span> Start Scanner</button>
              ) : (
                <button className="stop-button" onClick={stopScanner}><span>■</span> Stop Scanner</button>
              )}
            </div>

            <div className="upload-divider"><span>or</span></div>
            <button className="upload-button" onClick={() => fileInputRef.current?.click()}>
              <span className="upload-icon">↑</span>
              <span><strong>Upload barcode image</strong><small>{uploadedFile || 'JPG, PNG up to 10MB'}</small></span>
              <span className="upload-arrow">→</span>
            </button>
            <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/*" onChange={handleUpload} />
          </section>

          <section className="result-panel" aria-live="polite">
            <div className="section-label"><span>02</span><h2>Scan result</h2></div>
            {product ? (
              <div className="product-result">
                <img src={product.image} alt={`${product.name} product`} />
                <div className="product-intro"><span className="found-label">✓ Product identified</span><h3>{product.name}</h3><p>{product.brand}</p></div>
                <dl className="product-details"><div><dt>Barcode</dt><dd>{product.barcode}</dd></div><div><dt>Category</dt><dd>{product.category}</dd></div></dl>
                <p className="product-description">{product.description}</p>
                <button className="analysis-button" onClick={() => navigate('/home#nutrition')}>View Nutrition Analysis <span>→</span></button>
              </div>
            ) : (
              <div className="empty-result"><div className="empty-orbit"><span>⌕</span></div><h3>No product scanned</h3><p>Your identified product and nutrition details will appear here.</p></div>
            )}
          </section>
        </div>

        <section className="recent-section">
          <div className="section-label"><span>03</span><div><h2>Recent scans</h2><p>Your latest product lookups, all in one place.</p></div></div>
          <div className="recent-grid">
            {recentScans.length ? recentScans.map((scan) => (
              <article className="recent-card" key={scan.barcode}><div className="recent-icon">{scan.icon}</div><div className="recent-info"><h3>{scan.name}</h3><p>{scan.brand}</p><small>{scan.date}</small></div><button onClick={() => setProduct(scan)}>View Details <span>↗</span></button></article>
            )) : <div className="empty-recent">No products scanned yet. Scan your first product to get started.</div>}
          </div>
        </section>
      </main>
    </div>
  )
}

function Scanner() {
  const navigate = useNavigate()
  const [activeMethod, setActiveMethod] = useState(null)
  const [listening, setListening] = useState(false)
  const [voiceProduct, setVoiceProduct] = useState('')
  const [manualProduct, setManualProduct] = useState('')
  const [searched, setSearched] = useState(false)
  const [manualForm, setManualForm] = useState({ name: '', brand: '', category: '', barcode: '', quantity: '', unit: '', manufacturingDate: '', expiryDate: '', image: '' })
  const [voiceMessage, setVoiceMessage] = useState('')

  function chooseMethod(method) {
    if (method.path) return navigate(method.path)
    setActiveMethod(method.tone)
    setSearched(false)
  }

  function listen() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceMessage('Voice input is not supported in this browser. Try Chrome or enter the product manually.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onresult = (event) => setVoiceProduct(event.results[0][0].transcript)
    recognition.onerror = () => setVoiceMessage('We could not hear a product. Please try again.')
    recognition.onend = () => setListening(false)
    setVoiceMessage('')
    setListening(true)
    recognition.start()
  }

  function updateManualField(event) {
    const { name, value, files } = event.target
    setManualForm((form) => ({ ...form, [name]: files?.[0]?.name || value }))
    if (name === 'name') setManualProduct(value)
  }

  function submitManualEntry(event) {
    event.preventDefault()
    setSearched(true)
  }

  return <div className="method-page"><Navbar /><main className="method-content">
    <header className="method-header"><div><span className="method-kicker">Product identification <span>•</span> 01</span><h1>Choose your <em>Scanner</em></h1><p>Choose how you want to identify your grocery product.</p></div><button className="method-back" onClick={() => navigate('/home')}>← Back to Home</button></header>
    <section className="method-grid">{methods.map((method, index) => <article className={`method-card ${method.tone}`} key={method.title}><div className="method-icon">{method.icon}</div><div className="method-number">0{index + 1}</div><h2>{method.title}</h2><p>{method.description}</p><button onClick={() => chooseMethod(method)}>{method.action}</button></article>)}</section>
    <section className="platform-section"><div className="platform-mark">✦</div><div><span className="method-kicker">One platform, four ways</span><h2>Identify food on <em>your terms.</em></h2><p>Identify your grocery products using the method that works best for you. Once identified, NutriMatrix can provide product information, nutrition analysis and personalized recommendations.</p></div></section>
    <section className="steps-section"><div className="method-kicker">How it works</div><div className="steps-grid"><div><b>01</b><h3>Choose a Method</h3><p>Select Receipt, Barcode, Voice or Manual Entry.</p></div><div><b>02</b><h3>Identify Product</h3><p>NutriMatrix identifies the grocery product.</p></div><div><b>03</b><h3>Explore Insights</h3><p>View nutrition information, healthy alternatives and other insights.</p></div></div></section>
  </main>{activeMethod && <div className="method-modal-backdrop" onClick={() => setActiveMethod(null)}><section className={`method-modal ${activeMethod === 'manual' ? 'manual-modal' : ''}`} onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setActiveMethod(null)}>×</button>{activeMethod === 'voice' ? <><span className="modal-icon">🎤</span><h2>Voice Input</h2><p>Tell NutriMatrix what product you are looking for.</p><button className={`mic-button ${listening ? 'listening' : ''}`} onClick={listen}>{listening ? 'Listening...' : 'Tap to speak'}</button>{voiceMessage && <p className="voice-message">{voiceMessage}</p>}{voiceProduct && <div className="recognized"><small>Recognized product</small><strong>{voiceProduct}</strong><button onClick={() => navigate('/barcode-scanner')}>Search Product →</button></div>}</> : <><span className="modal-icon">⌨️</span><h2>Manual Product Entry</h2><p>Add product, quantity, and expiry details.</p><form className="manual-form" onSubmit={submitManualEntry}><fieldset><legend>1. Product Information</legend><div className="manual-fields"><label>Product Name*<input required name="name" value={manualForm.name} onChange={updateManualField} placeholder="e.g. Almond milk" /></label><label>Brand Name<input name="brand" value={manualForm.brand} onChange={updateManualField} placeholder="Brand" /></label><label>Category*<select required name="category" value={manualForm.category} onChange={updateManualField}><option value="">Select category</option><option>Fruits</option><option>Vegetables</option><option>Dairy</option><option>Grains</option><option>Snacks</option><option>Beverages</option></select></label><label>Barcode / Product ID<input name="barcode" value={manualForm.barcode} onChange={updateManualField} placeholder="Optional ID" /></label><label>Product Image<input type="file" name="image" accept="image/*" onChange={updateManualField} /></label></div></fieldset><fieldset><legend>2. Quantity Details</legend><div className="manual-fields"><label>Quantity<input type="number" min="0" step="any" name="quantity" value={manualForm.quantity} onChange={updateManualField} placeholder="0" /></label><label>Unit<select name="unit" value={manualForm.unit} onChange={updateManualField}><option value="">Select unit</option><option>kg</option><option>g</option><option>L</option><option>ml</option><option>pieces</option><option>packets</option></select></label></div></fieldset><fieldset><legend>3. 📅 Expiry Information</legend><div className="manual-fields"><label>Manufacturing Date<input type="date" name="manufacturingDate" value={manualForm.manufacturingDate} onChange={updateManualField} /></label><label>Expiry Date<input type="date" name="expiryDate" value={manualForm.expiryDate} onChange={updateManualField} /></label></div></fieldset><button className="manual-submit" type="submit">Search Product →</button></form>{searched && <div className="matching-results"><small>Matching products</small>{matchingProducts.filter((name) => !manualProduct || name.toLowerCase().includes(manualProduct.toLowerCase())).map((name) => <div key={name}><span>{name}</span><button onClick={() => navigate('/barcode-scanner')}>Select Product</button></div>)}</div>}</>}</section></div>}</div>
}

export default Scanner