import { useEffect, useRef, useState } from 'react'
import { BarcodeFormat, BrowserMultiFormatReader } from '@zxing/browser'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { apiRequest } from '../api.js'
import './Scanner.css'

async function detectExpiryDate(imageSource) {
  const blob = imageSource instanceof Blob
    ? imageSource
    : imageSource instanceof HTMLCanvasElement
      ? await new Promise((resolve, reject) => imageSource.toBlob((canvasBlob) => {
        if (canvasBlob) resolve(canvasBlob)
        else reject(new Error('Unable to prepare the image for expiry-date detection.'))
      }, 'image/jpeg', 0.92))
      : await (await fetch(imageSource)).blob()
  const formData = new FormData()
  formData.append('image', blob, imageSource.name || 'expiry-date.jpg')
  const result = await apiRequest('/api/expiry/detect', { method: 'POST', body: formData })
  return result.expiry_date || ''
}

function playScanBeep() {
  try {
    const audioContext = window.__nutriMatrixAudioContext || new (window.AudioContext || window.webkitAudioContext)()
    window.__nutriMatrixAudioContext = audioContext
    if (audioContext.state === 'suspended') audioContext.resume()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.16)
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.17)
    oscillator.addEventListener('ended', () => oscillator.disconnect())
  } catch {}
}

function ScannerPage() {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)
  const readerRef = useRef(null)
  const controlsRef = useRef(null)
  const scanActiveRef = useRef(false)
  const scanGenerationRef = useRef(0)
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const country = 'India'
  const [barcodeInput, setBarcodeInput] = useState('')
  const [productNameInput, setProductNameInput] = useState('')
  const [product, setProduct] = useState(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [dateSource, setDateSource] = useState('')
  const [pantryMessage, setPantryMessage] = useState('')
  const [history, setHistory] = useState([])
  const [historyError, setHistoryError] = useState('')

  async function loadHistory() {
    try {
      const result = await apiRequest('/api/expiry-products')
      setHistory((result.products || []).filter((item) => item.source === 'barcode'))
      setHistoryError('')
    } catch (historyLoadError) {
      if (historyLoadError.message !== 'Not authenticated.') setHistoryError(historyLoadError.message)
    }
  }

  function stopScanner() {
    scanGenerationRef.current += 1
    scanActiveRef.current = false
    controlsRef.current?.stop?.()
    controlsRef.current = null
    readerRef.current?.reset?.()
    readerRef.current = null
    videoRef.current?.srcObject?.getTracks?.().forEach((track) => track.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setScanning(false)
  }

  async function lookupBarcode(barcode, imageSource = null) {
    stopScanner()
    setProduct(null)
    setLoading(true)
    setError('')
    setExpiryDate('')
    setDateSource('')
    setPantryMessage('')
    try {
      const cleanedBarcode = String(barcode || '').replace(/\D/g, '')
      if (!/^\d{8,14}$/.test(cleanedBarcode)) {
        throw new Error('Please provide a valid barcode.')
      }

      const result = await apiRequest('/api/product/barcode', {
        method: 'POST',
        body: JSON.stringify({ barcode: cleanedBarcode })
      })

      const resolvedProduct = result.product || null
      setProduct(resolvedProduct)
      setBarcodeInput('')
      setProductNameInput('')
      if (resolvedProduct) {
        setError('')
      }

      if (imageSource) {
        try {
          const detectedExpiryDate = await detectExpiryDate(imageSource)
          if (detectedExpiryDate) {
            setExpiryDate(detectedExpiryDate)
            setDateSource('package image OCR')
          }
        } catch (ocrError) {
          setError(`Product identified. Expiry date was not readable: ${ocrError.message}`)
        }
      }
    } catch (lookupError) {
      setProduct(null)
      setError(lookupError.message || 'Unable to identify this product.')
    } finally {
      setLoading(false)
    }
  }

  async function handleManualBarcodeSearch(event) {
    event.preventDefault()
    const cleanedBarcode = String(barcodeInput || '').replace(/\D/g, '')
    if (!/^\d{8,14}$/.test(cleanedBarcode)) {
      setError('Please provide a valid barcode.')
      return
    }
    await lookupBarcode(cleanedBarcode)
  }

  async function handleProductNameSearch(event) {
    event.preventDefault()
    const query = productNameInput.trim()
    if (!query) {
      setError('Please enter a product name to search.')
      return
    }

    setProduct(null)
    setExpiryDate('')
    setDateSource('')
    setLoading(true)
    setError('')
    setPantryMessage('')
    try {
      const result = await apiRequest('/api/product/search', {
        method: 'POST',
        body: JSON.stringify({ query, country })
      })
      const foundProduct = result.products?.[0] || null
      if (!foundProduct) {
        setProduct(null)
        setError('No matching product was found. Try another product name.')
        return
      }
      setProduct(foundProduct)
      setBarcodeInput('')
      setProductNameInput('')
    } catch (searchError) {
      setProduct(null)
      setError(searchError.message || 'No matching product was found. Try another product name.')
    } finally {
      setLoading(false)
    }
  }

  async function handleExpiryUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')
    setExpiryDate('')
    setDateSource('')

    try {
      const detectedExpiryDate = await detectExpiryDate(file)
      setExpiryDate(detectedExpiryDate)
      if (!detectedExpiryDate) {
        setError('Expiry date could not be detected clearly. Please scan again or upload a clearer image.')
      } else {
        setDateSource('OCR detection')
      }
    } catch (uploadError) {
      setError(uploadError.message || 'Expiry date could not be detected clearly. Please scan again or upload a clearer image.')
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  async function handleAddToPantry() {
    if (!product || !expiryDate) {
      setError('Please confirm the product and expiry date before saving to the Digital Pantry.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await apiRequest('/api/pantry', {
        method: 'POST',
        body: JSON.stringify({
          product: {
            name: product.name,
            brand: product.brand,
            category: product.category,
            barcode: product.barcode,
            image: product.image
          },
          expiryDate
        })
      })
      const expiryAlert = result?.expiryAlert
      if (expiryAlert && typeof expiryAlert === 'object') {
        const { daysRemaining, status } = expiryAlert
        const remainingText = daysRemaining < 0
          ? `${Math.abs(daysRemaining)} days past expiry`
          : `${daysRemaining} days remaining`
        setPantryMessage(`${product.name} added to Digital Pantry. Expiry alert: ${status} — ${remainingText}.`)
      } else {
        setPantryMessage(`${product.name} added to Digital Pantry.`)
      }
      await loadHistory()
    } catch (pantryError) {
      setError(pantryError.message || 'Unable to save this item to the Digital Pantry.')
    } finally {
      setLoading(false)
    }
  }

  async function deleteHistoryItem(item) {
    if (!window.confirm(`Delete ${item.name} from barcode history?`)) return
    try {
      await apiRequest(`/api/expiry-products/${item.id}`, { method: 'DELETE' })
      setHistory((current) => current.filter((historyItem) => historyItem.id !== item.id))
    } catch (deleteError) {
      setHistoryError(deleteError.message || 'Unable to delete this product from history.')
    }
  }

  async function startScanner() {
    if (scanActiveRef.current || !videoRef.current) return
    setError('')
    setProduct(null)
    setBarcodeInput('')
    setProductNameInput('')
    setFileName('')
    setExpiryDate('')
    setDateSource('')
    setPantryMessage('')
    scanActiveRef.current = true
    const scanGeneration = ++scanGenerationRef.current
    setScanning(true)
    const reader = new BrowserMultiFormatReader(undefined, {
      delayBetweenScanAttempts: 100,
      delayBetweenScanSuccess: 250
    })
    reader.possibleFormats = [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF
    ]
    readerRef.current = reader
    try {
      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, scanError) => {
        if (result && scanActiveRef.current && scanGenerationRef.current === scanGeneration) {
          scanActiveRef.current = false
          playScanBeep()
          const canvas = document.createElement('canvas')
          canvas.width = videoRef.current.videoWidth || videoRef.current.clientWidth || 1280
          canvas.height = videoRef.current.videoHeight || videoRef.current.clientHeight || 720
          canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
          lookupBarcode(result.getText(), canvas)
        }
        if (scanError?.name === 'NotAllowedError' && scanActiveRef.current && scanGenerationRef.current === scanGeneration) {
          stopScanner()
          setError('Camera permission was denied. Upload a barcode and package image instead.')
        }
      })
      if (readerRef.current !== reader || !scanActiveRef.current || scanGenerationRef.current !== scanGeneration) {
        controls.stop?.()
        reader.reset?.()
        return
      }
      controlsRef.current = controls
    } catch (scannerError) {
      if (scanActiveRef.current) {
        stopScanner()
        setError(scannerError?.name === 'NotAllowedError' ? 'Camera permission was denied. Upload a barcode and package image instead.' : 'Unable to open the camera. Check browser permission or upload an image instead.')
      }
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setLoading(true)
    setError('')
    setProduct(null)
    const imageUrl = URL.createObjectURL(file)
    try {
      const result = await new BrowserMultiFormatReader().decodeFromImageUrl(imageUrl)
      playScanBeep()
      await lookupBarcode(result.getText(), file)
    } catch {
      setLoading(false)
      setError('No barcode was detected. Upload a clear package image with the barcode and date text visible.')
    } finally {
      URL.revokeObjectURL(imageUrl)
      event.target.value = ''
    }
  }

  useEffect(() => {
    const primeAudio = () => {
      try {
        const audioContext = window.__nutriMatrixAudioContext || new (window.AudioContext || window.webkitAudioContext)()
        window.__nutriMatrixAudioContext = audioContext
        audioContext.resume()
      } catch {}
    }
    window.addEventListener('pointerdown', primeAudio, { once: true })
    window.addEventListener('keydown', primeAudio, { once: true })
    return () => {
      window.removeEventListener('pointerdown', primeAudio)
      window.removeEventListener('keydown', primeAudio)
      stopScanner()
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [])

  function prepareBarcodeUpload() {
    stopScanner()
    setProduct(null)
    setBarcodeInput('')
    setProductNameInput('')
    setExpiryDate('')
    setDateSource('')
    setFileName('')
    setError('')
    setPantryMessage('')
  }

  return (
    <div className="barcode-page">
      <Navbar />
      <main className="barcode-content">
        <button className="method-back" onClick={() => navigate('/scanner')}>← Back to Scanner</button>
        <span className="method-kicker">Product detection</span>
        <h1>Barcode <em>Scanner</em></h1>
        <p>Choose the country, scan a barcode, or search by product name, then confirm the expiry date before saving it to your Digital Pantry.</p>

        <div className="barcode-workspace">
          <section className="barcode-scanner-column" aria-label="Barcode camera scanner">
            <div className="barcode-preview">
              <video ref={videoRef} className={scanning ? 'barcode-video visible' : 'barcode-video'} muted playsInline />
              <div className="barcode-frame" />
              <small>{loading ? 'Reading product details and dates...' : scanning ? 'Hold the barcode steady in the frame' : product ? 'Product identified' : 'Camera is stopped'}</small>
            </div>

            <div className="barcode-actions">
              <button className={`barcode-action ${scanning ? 'stop-scanner' : ''}`} type="button" onClick={scanning ? stopScanner : startScanner}>{scanning ? '■ Stop Barcode Scanner' : '◉ Scan Barcode'}</button>
              <button className="barcode-action barcode-upload" type="button" onClick={() => { prepareBarcodeUpload(); fileInputRef.current?.click() }} disabled={loading}>↑ Upload Barcode Image</button>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleUpload} />
            </div>
          </section>

          <section className="barcode-search-panel" aria-label="Search product">
            <div className="barcode-field">
              <label htmlFor="country-select">Country</label>
              <output id="country-select" className="country-fixed">India</output>
            </div>

            <form onSubmit={handleManualBarcodeSearch} className="barcode-field">
              <label htmlFor="barcode-input">Barcode Number</label>
              <div className="inline-search">
                <input id="barcode-input" value={barcodeInput} onChange={(event) => setBarcodeInput(event.target.value)} placeholder="8901234567890" inputMode="numeric" />
                <button type="submit" disabled={loading}>Search Product</button>
              </div>
            </form>

            <form onSubmit={handleProductNameSearch} className="barcode-field">
              <label htmlFor="product-name-input">Product Name <span>(optional)</span></label>
              <div className="inline-search">
                <input id="product-name-input" value={productNameInput} onChange={(event) => setProductNameInput(event.target.value)} placeholder="Milk" />
                <button type="submit" disabled={loading}>Search Product</button>
              </div>
            </form>
          </section>
        </div>

        {fileName && <p className="barcode-file">Uploaded: {fileName}</p>}
        {error && <p className="barcode-error" role="alert">{error}</p>}

        {product && (
          <section className="barcode-result" aria-live="polite">
            {product.image
              ? <img src={product.image} alt={product.name} />
              : <div className="barcode-result-image-placeholder" aria-hidden="true">🥫</div>}
            <div>
              <span className="method-kicker">Product detected</span>
              <h2>{product.name}</h2>
              <p>{product.brand || 'Brand not available'} · {product.category || 'Category not available'}</p>
              {product.source === 'nutrimatrix-barcode' && <p className="barcode-product-description">{product.description}</p>}
              <dl>
                <div><dt>Product</dt><dd>{product.name}</dd></div>
                <div><dt>Brand</dt><dd>{product.brand || 'Not available'}</dd></div>
                <div><dt>Category</dt><dd>{product.category || 'Not available'}</dd></div>
                <div><dt>Barcode</dt><dd>{product.barcode || barcodeInput || 'Not available'}</dd></div>
              </dl>

              <div className="expiry-controls">
                <label htmlFor="barcode-expiry">Expiry date</label>
                <input id="barcode-expiry" type="date" value={expiryDate} onChange={(event) => { setExpiryDate(event.target.value); setDateSource('manual entry') }} />
                <label className="expiry-upload-button" htmlFor="expiry-upload-input">📤 Upload Expiry Image</label>
                <input id="expiry-upload-input" type="file" accept="image/*" hidden onChange={handleExpiryUpload} />
              </div>

              {dateSource && <p className="expiry-auto">Expiry date detected from {dateSource}.</p>}
              {pantryMessage && <p className="barcode-success" role="status">{pantryMessage}</p>}
              <button className="barcode-action pantry-submit" type="button" onClick={handleAddToPantry} disabled={!expiryDate || loading}>Save to Digital Pantry</button>
            </div>
          </section>
        )}
        <section className="barcode-history" aria-labelledby="barcode-history-title">
          <div><span className="method-kicker">Saved products</span><h2 id="barcode-history-title">Barcode history</h2></div>
          {historyError && <p className="barcode-error" role="alert">{historyError}</p>}
          {history.length === 0
            ? <p className="barcode-history-empty">Products saved from barcode detection will appear here.</p>
            : <div className="barcode-history-list">{history.map((item) => (
              <article className="barcode-history-item" key={item.id}>
                <div><strong>{item.name}</strong><span>{item.brand || 'Barcode product'}{item.barcode ? ` · ${item.barcode}` : ''}</span><small>{item.expiryDate ? `Expires ${item.expiryDate}` : 'No expiry date'}</small></div>
                <button type="button" onClick={() => deleteHistoryItem(item)}>Delete</button>
              </article>
            ))}</div>}
        </section>
      </main>
    </div>
  )
}

export default ScannerPage
