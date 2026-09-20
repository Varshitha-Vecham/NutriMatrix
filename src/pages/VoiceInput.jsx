import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api.js'

const numbers = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }
const unitWords = 'packets?|litres?|liters?|kg|kgs?|grams?|g|pieces?|bottles?|boxes?|cans?'
const brands = [
  { name: 'Aashirvaad', aliases: ['aashirvaad', 'aashirwad'] }, { name: 'Amul', aliases: ['amul'] },
  { name: 'Tata Sampann', aliases: ['tata sampann'] }, { name: 'Fortune', aliases: ['fortune'] },
  { name: 'Parle', aliases: ['parle'] }, { name: 'Britannia', aliases: ['britannia'] },
  { name: 'Sunfeast', aliases: ['sunfeast'] }, { name: 'Nestle', aliases: ['nestle'] }, { name: 'Mother Dairy', aliases: ['mother dairy'] }
]

function toDate(year, month, day) { const d = new Date(year, month - 1, day); return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '' }
function parseExpiry(raw) {
  const value = String(raw || '').trim().toLowerCase().replace(/,/g, '')
  const now = new Date()
  if (value === 'tomorrow') { now.setDate(now.getDate() + 1); return now.toISOString().slice(0, 10) }
  const relative = value.match(/^in\s+(\d+)\s+days?$/)
  if (relative) { now.setDate(now.getDate() + Number(relative[1])); return now.toISOString().slice(0, 10) }
  const numeric = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (numeric) return toDate(Number(numeric[3]), Number(numeric[2]), Number(numeric[1]))
  const written = value.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\s+(\d{4})$/)
  if (!written) return ''
  const month = new Date(`1 ${written[2]} 2000`).getMonth() + 1
  return month ? toDate(Number(written[3]), month, Number(written[1])) : ''
}
function title(value) { return value.replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function blank() { return { id: `${Date.now()}-${Math.random()}`, name: '', brand: '', quantity: '', unit: '', expiryDate: '' } }
function extractItems(transcript) {
  const text = transcript.replace(/\s+/g, ' ').trim()
  const dates = [...text.toLowerCase().matchAll(/(?:expiry(?:\s+date|\s+is)?|expires?(?:\s+on)?|best\s+before)\s+(tomorrow|in\s+\d+\s+days?|\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{1,2}(?:st|nd|rd|th)?\s+[a-z]+\s+\d{4})/gi)].map((match) => parseExpiry(match[1])).filter(Boolean)
  const pattern = new RegExp(`(?:\\b(?:add|and|i bought)\\s+)?(${Object.keys(numbers).join('|')}|\\d+)\\s*(${unitWords})?\\s*(?:of\\s+)?([a-z][a-z '\\-]*?)(?=\\s*(?:,|\\.|\\band\\s+(?:(?:${Object.keys(numbers).join('|')}|\\d+)\\b|(?:their\\s+)?(?:expiry|expires?|best)\\b)|\\b(?:expiry|expires?|best)\\b|$))`, 'gi')
  const matches = [...text.matchAll(pattern)]
  const results = matches.map((match, index) => {
    const phrase = match[3].replace(/\b(?:their\s+)?(?:expiry(?:\s+date|\s+is)?|expires?(?:\s+on)?|best\s+before)\b.*$/i, '').trim()
    const brandMatch = brands.find((entry) => entry.aliases.some((alias) => phrase.toLowerCase().startsWith(alias)))
    const spokenBrand = brandMatch?.aliases.find((alias) => phrase.toLowerCase().startsWith(alias)) || ''
    const productName = (brandMatch ? phrase.slice(spokenBrand.length).replace(/^\s*(?:at|and)\s+/i, '') : phrase).trim()
    return { id: `${Date.now()}-${index}`, name: title(productName), brand: brandMatch?.name || '', quantity: String(numbers[match[1].toLowerCase()] || match[1]), unit: title(match[2] || ''), expiryDate: matches.length === 1 ? dates[0] || '' : dates[index] || '' }
  }).filter((item) => item.name)
  return results.length ? results : [blank()]
}

function VoiceHistory({ products, loading, onDelete }) {
  if (loading) return <p className="voice-history-empty">Loading voice history…</p>
  if (!products.length) return <p className="voice-history-empty">Items you add with Voice Input will appear here.</p>

  return <div className="voice-history-list">{products.map((product) => <article className="voice-history-item" key={product.id}>
    <div><strong>{product.name}</strong><small>{product.quantity ? `${product.quantity}${product.unit ? ` ${product.unit}` : ''}` : 'Quantity not entered'}</small><small>{product.expiryDate ? `Expires ${product.expiryDate}` : 'No expiry date entered'}</small></div>
    <button type="button" onClick={() => onDelete(product.id)} aria-label={`Delete ${product.name} from voice history`}>Delete</button>
  </article>)}</div>
}

export default function VoiceInput() {
  const navigate = useNavigate(); const recognitionRef = useRef(null); const sessionTimerRef = useRef(null)
  const [listening, setListening] = useState(false), [transcript, setTranscript] = useState(''), [items, setItems] = useState([]), [history, setHistory] = useState([]), [historyLoading, setHistoryLoading] = useState(true), [error, setError] = useState(''), [message, setMessage] = useState(''), [saving, setSaving] = useState(false)
  function loadHistory() {
    setHistoryLoading(true)
    return apiRequest('/api/expiry-products')
      .then(({ products = [] }) => setHistory(products.filter((product) => product.source === 'voice' || product.receiptFileName === 'Voice input')))
      .catch((requestError) => { if (requestError.message !== 'Not authenticated.') setError(requestError.message) })
      .finally(() => setHistoryLoading(false))
  }
  useEffect(() => {
    loadHistory()
    return () => { clearTimeout(sessionTimerRef.current); recognitionRef.current?.abort?.() }
  }, [])
  function stopListening() { clearTimeout(sessionTimerRef.current); recognitionRef.current?.stop?.(); setListening(false) }
  function resetDetectedItems() { setTranscript(''); setItems([]) }
  function listen() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setError(''); setMessage('')
    if (!Recognition) return setError('Voice recognition is not supported in this browser. Please use Google Chrome or enter the product manually.')
    const recognition = new Recognition(); recognition.lang = 'en-IN'; recognition.continuous = true; recognition.interimResults = true
    recognition.onresult = (event) => {
      const said = [...event.results].filter((result) => result.isFinal).map((result) => result[0].transcript.trim()).join(' ')
      if (!said) return
      setTranscript(said); setItems(extractItems(said)); setMessage('Keep speaking to add more items, or press Stop Speaking when you are finished.')
    }
    recognition.onerror = (event) => setError(({ 'not-allowed': 'Microphone access is required for Voice Input. Please allow microphone access in your browser settings.', 'service-not-allowed': 'Microphone access is required for Voice Input. Please allow microphone access in your browser settings.', 'no-speech': 'No speech was detected. Please try again and speak clearly.', network: 'Speech recognition had a network error. Please check your connection and try again.' })[event.error] || 'Speech recognition could not be completed. Please try again.')
    recognition.onend = () => { clearTimeout(sessionTimerRef.current); setListening(false) }
    recognitionRef.current = recognition; setListening(true); recognition.start()
    sessionTimerRef.current = setTimeout(() => { recognition.stop(); setMessage('Your one-minute speaking session has ended. Review the detected details or start a new session.') }, 60000)
  }
  function update(id, field, value) { setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item)) }
  function removeDetectedItem(id) { setItems((current) => current.filter((item) => item.id !== id)); setTranscript(''); setMessage('') }
  async function save() { setError(''); setMessage(''); if (items.some((item) => !item.name.trim() || !Number(item.quantity) || Number(item.quantity) <= 0 || !item.expiryDate)) return setError('Each item needs a product name, a valid quantity, and an expiry date before it can be added to the pantry.'); const savedCount = items.length; setSaving(true); try { await apiRequest('/api/expiry-products', { method: 'POST', body: JSON.stringify({ receiptFileName: 'Voice input', source: 'voice', products: items }) }); await loadHistory(); stopListening(); resetDetectedItems(); setMessage(`Grocery${savedCount > 1 ? ' items' : ''} added successfully to your Digital Pantry.`) } catch (e) { setError(e.message) } finally { setSaving(false) } }
  async function deleteHistoryProduct(id) {
    setError('')
    try { await apiRequest(`/api/expiry-products/${id}`, { method: 'DELETE' }); setHistory((current) => current.filter((product) => product.id !== id)) } catch (deleteError) { setError(deleteError.message) }
  }
  return <div className="voice-entry">
    <div className="voice-entry-heading">
      <span className="modal-icon">🎤</span><div>
        <h2>Voice Grocery Input</h2>
        <p>Add groceries quickly using your voice.</p></div></div>
        <div className="voice-controls">
          <button className={`voice-start ${listening ? 'listening' : ''}`} type="button" onClick={listening ? stopListening : listen}>{listening ? '🔴 Listening...' : '🎙 Start Speaking'}</button>{listening && <button className="voice-stop" type="button" onClick={stopListening}>Stop Speaking</button>}</div><p className="voice-instruction">Speak the product name, quantity, and expiry date in English. Each speaking session lasts up to one minute.</p><div className="voice-examples"><span>“Add 2 packets Aashirvaad Atta, expiry date 25 September 2026.”</span>
              <span>“Add 1 litre Amul Milk, expiry date 20 September 2026.”</span></div>{error && <p className="voice-error" role="alert">{error}</p>}{message && <p className="voice-message" role="status">{message}</p>}{transcript && <section className="voice-transcript"><small>You Said</small><p>“{transcript}”</p></section>}{items.length > 0 && <section className="voice-details"><h3>Detected Grocery Details</h3><p>All fields are editable. Dates are stored as YYYY-MM-DD.</p>
              <div className="voice-item-list">{items.map((item, index) => <fieldset key={item.id}><legend>Item {index + 1}</legend>
              <div className="voice-fields">
                <label>Product Name<input value={item.name} onChange={(e) => update(item.id, 'name', e.target.value)} /></label>
                <label>Quantity<input type="number" min="0" step="any" value={item.quantity} onChange={(e) => update(item.id, 'quantity', e.target.value)} /></label>
                <label>Unit<input value={item.unit} onChange={(e) => update(item.id, 'unit', e.target.value)} placeholder="packets, kg, litre" /></label>
                <label>Expiry Date<input type="date" value={item.expiryDate} onChange={(e) => update(item.id, 'expiryDate', e.target.value)} /></label></div>{!item.expiryDate && <p className="voice-missing">Expiry date not detected. Please enter the expiry date before adding this item to the pantry.</p>}
                <button className="voice-remove" type="button" onClick={() => removeDetectedItem(item.id)}>Remove item</button></fieldset>)}</div>
                <div className="voice-save-actions">
                  <button className="voice-add-row" type="button" onClick={() => setItems((current) => [...current, blank()])}>+ Add another item</button>
                  <button className="voice-save" type="button" disabled={saving} onClick={save}>{saving ? 'Adding…' : 'Add to Pantry'}</button></div>{message.includes('successfully') && <button className="voice-pantry" type="button" onClick={() => navigate('/home')}>View Digital Pantry</button>}</section>}
    <section className="voice-history"><div className="voice-history-heading"><span className="method-kicker">Saved products</span><h3>Voice input history</h3><p>Your items are linked to your account.</p></div><VoiceHistory products={history} loading={historyLoading} onDelete={deleteHistoryProduct} /></section></div>
}
