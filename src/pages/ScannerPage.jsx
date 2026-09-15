import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { createWorker } from 'tesseract.js'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { apiRequest, OCR_API_URL } from '../api.js'
import './Scanner.css'

async function detectPackageData(imageSource) {
  if (!imageSource) return { expiryDate: '', manufacturingDate: '', batchNumber: '' }
  const blob = imageSource instanceof HTMLCanvasElement
    ? await new Promise((resolve) => imageSource.toBlob(resolve, 'image/jpeg', 0.92))
    : await (await fetch(imageSource)).blob()
  const formData = new FormData()
  formData.append('image', blob, 'barcode-package.jpg')
  const response = await fetch(`${OCR_API_URL}/api/scanner/barcode-details`, { method: 'POST', body: formData })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message || 'Unable to read package details.')
  return result.details
}

const packageDatePattern = /\b(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{2,4})\b|\b(20\d{2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{1,2})\b|\b(\d{1,2})\s*[./-]\s*(\d{2,4})\b/

function normalizePackageDate(value) {
  const dateText = String(value || '').match(packageDatePattern)?.[0]
  if (!dateText) return ''
  const parts = dateText.split(/[./-]/).map(Number)
  let year
  let month
  let day
  if (parts.length === 2) {
    [month, year] = parts
    if (year < 100) year += 2000
    return month >= 1 && month <= 12 ? `${year}-${String(month).padStart(2, '0')}` : ''
  }
  if (parts[0] >= 2000) [year, month, day] = parts
  else [day, month, year] = parts
  if (year < 100) year += 2000
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    : ''
}

function parseOcrPackageText(text) {
  text = String(text || '').replace(/\bM\s*F\s*G\b/gi, 'MFG').replace(/\bM\s*F\s*D\b/gi, 'MFD').replace(/\bE\s*X\s*P\b/gi, 'EXP').replace(/\bB\s*A\s*T\s*C\s*H\b/gi, 'BATCH')
  let expiryDate = ''
  let manufacturingDate = ''
  const allDates = []
  for (const line of String(text || '').split(/\r?\n/)) {
    for (const rawDate of line.matchAll(/(?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4})|(?:20\d{2}[./-]\d{1,2}[./-]\d{1,2})|(?:\d{1,2}[./-]\d{2,4})/g)) {
      const date = normalizePackageDate(rawDate[0])
      if (date && !allDates.includes(date)) allDates.push(date)
    }
    const matches = line.matchAll(/\b(exp|expiry|use\s*by|best\s*before|mfg|mfd|pkd|manufactured|production)\b[^\d\n]*((?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4})|(?:20\d{2}[./-]\d{1,2}[./-]\d{1,2})|(?:\d{1,2}[./-]\d{2,4}))/gi)
    for (const match of matches) {
      const date = normalizePackageDate(match[2])
      if (!date) continue
      if (!expiryDate && /exp|expiry|use|best/i.test(match[1])) expiryDate = date
      if (!manufacturingDate && /mfg|mfd|pkd|manufactured|production/i.test(match[1])) manufacturingDate = date
    }
  }
  if (!manufacturingDate && allDates.length > 1) manufacturingDate = allDates[0]
  if (!expiryDate && allDates.length) expiryDate = allDates[allDates.length - 1]
  const batchNumber = String(text || '').match(/(?:batch|lot)(?:\s*(?:no|number))?\s*[:#-]?\s*([A-Z0-9][A-Z0-9./-]{2,})/i)?.[1] || ''
  return { expiryDate, manufacturingDate, batchNumber }
}

function parseGs1Barcode(value) {
  const text = String(value || '').replace(/[\x1d\u001d]/g, '|')
  const dates = (text.match(/(?:^|\|)(11|17)(\d{6})/) || [])
  const toDate = (raw) => raw ? `20${raw.slice(0, 2)}-${raw.slice(2, 4)}-${raw.slice(4, 6)}` : ''
  const batch = text.match(/(?:^|\|)10([^|]{1,20})/)?.[1] || ''
  return {
    manufacturingDate: dates[1] === '11' ? toDate(dates[2]) : '',
    expiryDate: dates[1] === '17' ? toDate(dates[2]) : '',
    batchNumber: batch
  }
}

async function detectPackageDataWithTesseract(imageSource) {
  if (!imageSource) return { expiryDate: '', manufacturingDate: '', batchNumber: '' }
  const worker = await createWorker('eng')
  try {
    const result = await worker.recognize(imageSource)
    return parseOcrPackageText(result.data.text)
  } finally {
    await worker.terminate()
  }
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
  const packageImageRef = useRef(null)
  const readerRef = useRef(null)
  const controlsRef = useRef(null)
  const scanActiveRef = useRef(false)
  const scanGenerationRef = useRef(0)
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [manufacturingDate, setManufacturingDate] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [expiryConfirmed, setExpiryConfirmed] = useState(false)
  const [dateSource, setDateSource] = useState('')

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
    setLoading(true)
    setError('')
    setExpiryDate('')
    setManufacturingDate('')
    setBatchNumber('')
    setDateSource('')
    try {
      const result = await apiRequest(`/api/scanner/barcode/${encodeURIComponent(barcode)}`)
      setProduct(result.product)
      const gs1Data = parseGs1Barcode(barcode)
      const databaseData = {
        expiryDate: result.product.expiryDate || '',
        manufacturingDate: result.product.manufacturingDate || '',
        batchNumber: result.product.batchNumber || ''
      }
      const initialData = {
        expiryDate: gs1Data.expiryDate || databaseData.expiryDate,
        manufacturingDate: gs1Data.manufacturingDate || databaseData.manufacturingDate,
        batchNumber: gs1Data.batchNumber || databaseData.batchNumber
      }
      if (result.warning) setError(result.warning)
      setExpiryDate(initialData.expiryDate)
      setManufacturingDate(initialData.manufacturingDate)
      setBatchNumber(initialData.batchNumber)
      setDateSource(gs1Data.expiryDate || gs1Data.manufacturingDate || gs1Data.batchNumber ? 'GS1 barcode' : databaseData.expiryDate || databaseData.manufacturingDate || databaseData.batchNumber ? 'product database' : '')

      if (imageSource) {
        try {
          const [backendData, browserData] = await Promise.all([
            detectPackageData(imageSource).catch(() => ({ expiryDate: '', manufacturingDate: '', batchNumber: '' })),
            detectPackageDataWithTesseract(imageSource).catch(() => ({ expiryDate: '', manufacturingDate: '', batchNumber: '' }))
          ])
          const scannedData = {
            expiryDate: backendData.expiryDate || browserData.expiryDate,
            manufacturingDate: backendData.manufacturingDate || browserData.manufacturingDate,
            batchNumber: backendData.batchNumber || browserData.batchNumber
          }
          const nextExpiry = gs1Data.expiryDate || scannedData.expiryDate || databaseData.expiryDate
          const nextManufacturing = gs1Data.manufacturingDate || scannedData.manufacturingDate || databaseData.manufacturingDate
          const nextBatch = gs1Data.batchNumber || scannedData.batchNumber || databaseData.batchNumber
          setManufacturingDate(nextManufacturing || 'Upload a clear package-details image')
          setBatchNumber(nextBatch || 'Upload a clear package-details image')
          setExpiryDate(nextExpiry || 'Upload a clear package-details image')
          if (gs1Data.expiryDate || gs1Data.manufacturingDate || gs1Data.batchNumber) setDateSource('GS1 barcode')
          else if (scannedData.expiryDate || scannedData.manufacturingDate || scannedData.batchNumber) setDateSource('package image OCR')
        } catch {
          setError('Product identified. Packaging dates were not readable in this frame.')
        }
      }
    } catch (lookupError) {
      setProduct(null)
      setError(lookupError.message || 'Unable to identify this product.')
    } finally {
      setLoading(false)
    }
  }

  async function startScanner() {
    if (scanActiveRef.current || !videoRef.current) return
    setError('')
    setProduct(null)
    setExpiryDate('')
    setManufacturingDate('')
    setBatchNumber('')
    setDateSource('')
    scanActiveRef.current = true
    const scanGeneration = ++scanGenerationRef.current
    setScanning(true)
    const reader = new BrowserMultiFormatReader()
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
      await lookupBarcode(result.getText(), imageUrl)
    } catch {
      setLoading(false)
      setError('No barcode was detected. Upload a clear package image with the barcode and date text visible.')
    } finally {
      URL.revokeObjectURL(imageUrl)
    }
  }

  async function handlePackageImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    const imageUrl = URL.createObjectURL(file)
    try {
      const [backendData, browserData] = await Promise.all([
        detectPackageData(imageUrl).catch(() => ({ expiryDate: '', manufacturingDate: '', batchNumber: '' })),
        detectPackageDataWithTesseract(imageUrl).catch(() => ({ expiryDate: '', manufacturingDate: '', batchNumber: '' }))
      ])
      const scannedData = {
        expiryDate: backendData.expiryDate || browserData.expiryDate,
        manufacturingDate: backendData.manufacturingDate || browserData.manufacturingDate,
        batchNumber: backendData.batchNumber || browserData.batchNumber
      }
      setExpiryDate(scannedData.expiryDate || 'Upload a clear package-details image')
      setManufacturingDate(scannedData.manufacturingDate || 'Upload a clear package-details image')
      setBatchNumber(scannedData.batchNumber || 'Upload a clear package-details image')
      setDateSource('package image OCR')
      if (!scannedData.expiryDate && !scannedData.manufacturingDate && !scannedData.batchNumber) setError('No batch or date text was found. Capture the package side where MFD and EXP are printed.')
    } finally {
      setLoading(false)
      URL.revokeObjectURL(imageUrl)
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
    startScanner()
    return () => {
      window.removeEventListener('pointerdown', primeAudio)
      window.removeEventListener('keydown', primeAudio)
      stopScanner()
    }
  }, [])

  return <div className="barcode-page"><Navbar /><main className="barcode-content"><button className="method-back" onClick={() => navigate('/scanner')}>← Back to Scanner</button><span className="method-kicker">Barcode identification</span><h1>Barcode <em>Scanner</em></h1><p>Point your camera at the barcode and keep the expiry, manufacturing, and batch text visible.</p><div className="barcode-preview"><video ref={videoRef} className={scanning ? 'barcode-video visible' : 'barcode-video'} muted playsInline /><div className="barcode-frame" /><small>{loading ? 'Reading product details and dates...' : scanning ? 'Scanning automatically...' : product ? 'Product identified' : 'Camera is stopped'}</small></div><div className="barcode-actions"><button className={`barcode-action ${scanning ? 'stop-scanner' : ''}`} onClick={scanning ? stopScanner : startScanner}>{scanning ? '■ Stop Barcode Scanner' : '◉ Start Barcode Scanner'}</button><button className="barcode-action barcode-upload" onClick={() => fileInputRef.current?.click()} disabled={loading}>↑ Upload Barcode Image</button><input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleUpload} /></div>{fileName && <p className="barcode-file">Uploaded: {fileName}</p>}{error && <p className="barcode-error" role="alert">{error}</p>}{product && <section className="barcode-result" aria-live="polite">{product.image && <img src={product.image} alt={product.name} />}<div><span className="method-kicker">Product identified</span><h2>{product.name}</h2><p>{product.brand} · {product.category}</p><dl><div><dt>Barcode</dt><dd>{product.barcode}</dd></div><div><dt>Batch / lot</dt><dd>{batchNumber || 'Not detected'}</dd></div><div><dt>Manufacturing date</dt><dd>{manufacturingDate || 'Not detected'}</dd></div><div><dt>Expiry date</dt><dd>{expiryDate || 'Not detected'}</dd></div><div><dt>Serving</dt><dd>{product.serving || 'Not available'}</dd></div><div><dt>Calories</dt><dd>{product.nutrition?.calories == null ? 'Not available' : `${product.nutrition.calories} kcal`}</dd></div><div><dt>Protein</dt><dd>{product.nutrition?.protein == null ? 'Not available' : `${product.nutrition.protein} g`}</dd></div><div><dt>Carbs</dt><dd>{product.nutrition?.carbs == null ? 'Not available' : `${product.nutrition.carbs} g`}</dd></div><div><dt>Fat</dt><dd>{product.nutrition?.fat == null ? 'Not available' : `${product.nutrition.fat} g`}</dd></div></dl><p>{product.description}</p>{dateSource && <p className="expiry-auto">Dates and batch details detected from {dateSource}.</p>}{!expiryDate && <p className="expiry-unavailable">Expiry text was not visible to the camera. Show the package date text for automatic detection.</p>}<div className="expiry-required"><label htmlFor="barcode-expiry">Expiry date <span>(required only if not detected)</span></label><input id="barcode-expiry" type="date" value={expiryDate} onChange={(event) => { setExpiryDate(event.target.value); setExpiryConfirmed(false); setDateSource('manual entry') }} /><button type="button" disabled={!expiryDate} onClick={() => setExpiryConfirmed(true)}>Confirm Expiry Date</button>{expiryConfirmed && <small role="status">Expiry date confirmed: {expiryDate}</small>}</div></div></section>}</main></div>
}

export default ScannerPage
