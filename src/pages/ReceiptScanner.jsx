import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import './ReceiptScanner.css'

function ReceiptScanner() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [scanned, setScanned] = useState(false)
  function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setScanned(true)
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
          <h2>{scanned ? 'Receipt ready to review' : 'Upload your receipt'}</h2>
          <p>
            {fileName || 'Choose a clear photo or PDF of your grocery receipt.'}
          </p>

          {scanned ? (
            <button className="receipt-primary" onClick={() => navigate('/scanner')}>
              View Identified Products →
            </button>
          ) : (
            <>
              <button className="receipt-primary" onClick={() => inputRef.current?.click()}>
                Upload Receipt
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
      </main>
    </div>
  )
}

export default ReceiptScanner